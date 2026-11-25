import { z } from 'zod'
import { autoFixSpec, getByPath, validateSpec } from '@json-render/core'
import type { BlockDef } from './block.js'
import { CALL_TOOL, type Catalog } from './catalog.js'
import { toolCalls } from './calls.js'
import { extract, patternProblem } from './extract.js'
import { refreshSchema, type Spec } from './spec.js'

/** A problem json-render's own validation can't see. */
export type BlockIssue = {
  severity: 'error'
  code:
    | 'invalid_props'
    | 'unknown_event'
    | 'unknown_action'
    | 'call_tool_placement'
    | 'call_tool_name'
    | 'switch_binding'
  elementKey: string
  message: string
}

/** A value written as an expression, such as `{ "$state": "/on" }`. */
export const isExpression = (value: unknown) =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).some((key) => key.startsWith('$'))

/** Parses the props written as literals; expressions resolve at render. */
function parseProps(block: BlockDef, props: Record<string, unknown>) {
  const dynamic = Object.keys(props).filter(
    (key) => key in block.props.shape && isExpression(props[key]),
  )
  const without = (entries: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(entries).filter(([key]) => !dynamic.includes(key)),
    )
  const shape = without(block.props.shape) as z.ZodRawShape
  return z.strictObject(shape).safeParse(without(props))
}

/** How many `{ action: "callTool" }` objects `value` holds, at any depth. */
function callToolsIn(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce((n, item) => n + callToolsIn(item), 0)
  if (typeof value !== 'object' || value === null) return 0
  const own = (value as { action?: unknown }).action === CALL_TOOL ? 1 : 0
  return (
    own +
    Object.values(value).reduce<number>((n, item) => n + callToolsIn(item), 0)
  )
}

/**
 * Checks what json-render's own validation doesn't: each element's props
 * against its block (strict: no `className`), its events, the actions they
 * name, and gencn's rules: `callTool` runs only from an element's events,
 * which are always a person's (never `watch`, a chained `onSuccess` or
 * anything else that fires by itself), names a tool or a `$cond` between
 * names, and a Switch binds turnOn/turnOff or change, not both.
 */
export function validateBlocks(catalog: Catalog, spec: Spec): BlockIssue[] {
  const blocks = new Map(catalog.blocks.map((block) => [block.name, block]))
  const { actions = {} } = catalog.jsonRender.data as {
    actions?: Record<string, unknown>
  }
  const builtIns =
    catalog.jsonRender.schema.builtInActions?.map((a) => a.name) ?? []
  const issues: BlockIssue[] = []
  const report = (code: BlockIssue['code'], key: string, message: string) =>
    issues.push({ severity: 'error', code, elementKey: key, message })

  for (const [key, element] of Object.entries(spec.elements)) {
    const block = blocks.get(element.type)
    if (!block) continue // the catalog's schema reports unknown types
    const parsed = parseProps(block, element.props ?? {})
    if (!parsed.success) {
      const why = z.prettifyError(parsed.error).replaceAll('\n', ' ')
      report('invalid_props', key, `"${key}" (${element.type}): ${why}`)
    }
    const on = element.on ?? {}
    for (const [event, bound] of Object.entries(on)) {
      if (!block.events?.includes(event)) {
        report('unknown_event', key, `"${key}" has no "${event}" event`)
      }
      for (const { action } of [bound].flat()) {
        if (action in actions || builtIns.includes(action)) continue
        report('unknown_action', key, `"${key}" uses unknown "${action}"`)
      }
    }
    if (
      element.type === 'Switch' &&
      'change' in on &&
      ('turnOn' in on || 'turnOff' in on)
    ) {
      report(
        'switch_binding',
        key,
        `"${key}" binds change and turnOn/turnOff: a toggle would call twice. Bind turnOn and turnOff, or change alone.`,
      )
    }
  }

  const direct = Object.values(spec.elements).reduce(
    (n, { on }) =>
      n +
      Object.values(on ?? {})
        .flatMap((bound) => [bound].flat())
        .filter(({ action }) => action === CALL_TOOL).length,
    0,
  )
  if (callToolsIn(spec) > direct) {
    report(
      'call_tool_placement',
      spec.root,
      `${CALL_TOOL} may only be bound directly to an element's event in "on", never in watch, onSuccess, onError or anywhere that runs by itself.`,
    )
  }
  for (const call of toolCalls(spec)) {
    if (!call.tools) {
      report(
        'call_tool_name',
        call.element,
        `"${call.element}" ${call.event}: tool must be a tool's name, or a $cond choosing between names.`,
      )
    }
  }
  return issues
}

/** What `refresh` gets wrong in its own shape: text for the model, or nothing. */
function refreshProblems(refresh: unknown) {
  const parsed = refreshSchema.safeParse(refresh)
  if (!parsed.success) {
    return [`refresh: ${z.prettifyError(parsed.error).replaceAll('\n', ' ')}`]
  }
  return Object.entries(parsed.data.extract).flatMap(([path, { match }]) => {
    const problem = patternProblem(match)
    return problem ? [`refresh ${path}: match ${problem}`] : []
  })
}

/**
 * `spec` with json-render's lossless fixes (such as props moved out of the
 * wrong place). Never drops anything; `checkSpec` judges the result.
 */
export function autoFix<S extends Spec>(spec: S): S {
  const { spec: fixed } = autoFixSpec(spec, { lossy: false })
  return { ...spec, ...fixed }
}

/**
 * Every check a spec must pass before it's accepted or drawn: its shape and
 * block names (the catalog's schema), its tree (`validateSpec`), its blocks
 * and gencn's rules (`validateBlocks`), and its refresh's shape. Returns
 * text for the model to fix, or nothing.
 */
export function checkSpec(catalog: Catalog, spec: unknown) {
  const parsed = catalog.jsonRender.zodSchema().safeParse(spec)
  if (!parsed.success) return z.prettifyError(parsed.error)
  const valid = spec as Spec // parsed.data drops fields like `on`
  const errors = [
    ...validateSpec(valid)
      .issues.filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message),
    ...validateBlocks(catalog, valid).map((issue) => issue.message),
    ...(valid.refresh === undefined ? [] : refreshProblems(valid.refresh)),
  ]
  if (errors.length === 0) return undefined
  return ['The spec has errors:', ...errors.map((e) => `- ${e}`)].join('\n')
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const short = (text: string) =>
  JSON.stringify(text.length > 120 ? `${text.slice(0, 119)}…` : text)

/**
 * Checks a spec's refresh against a sample of its tool's output, read once
 * when the view is generated: every value extracts, fits the props bound
 * to it, and equals the spec's own `state`, so the view starts from what
 * the source says. Returns text for the model to fix, showing what each
 * regex matched, or nothing.
 */
export function checkRefresh(catalog: Catalog, spec: Spec, output: string) {
  if (!spec.refresh) return undefined
  const blocks = new Map(catalog.blocks.map((block) => [block.name, block]))
  const problems = extract(output, spec.refresh).flatMap((result) => {
    const seen =
      result.snippet === undefined ? '' : ` (matched ${short(result.snippet)})`
    if ('problem' in result)
      return [`- ${result.path}: ${result.problem}${seen}`]
    const misfits = Object.entries(spec.elements).flatMap(([key, element]) =>
      Object.entries(element.props ?? {}).flatMap(([prop, value]) => {
        const bound =
          isExpression(value) &&
          ((value as { $bindState?: unknown }).$bindState === result.path ||
            (value as { $state?: unknown }).$state === result.path)
        const schema = blocks.get(element.type)?.props.shape[prop] as
          z.ZodType | undefined
        return bound && schema && !schema.safeParse(result.value).success
          ? [
              `- ${result.path}: read ${JSON.stringify(result.value)}${seen}, which "${key}".${prop} can't show`,
            ]
          : []
      }),
    )
    if (misfits.length) return misfits
    const says = getByPath(spec.state ?? {}, result.path)
    return same(says, result.value)
      ? []
      : [
          `- ${result.path}: read now ${JSON.stringify(result.value)}${seen}; your state says ${JSON.stringify(says)}. If the snippet is the right device, update state.`,
        ]
  })
  return problems.length
    ? ["The view's refresh doesn't read back its state:", ...problems].join(
        '\n',
      )
    : undefined
}
