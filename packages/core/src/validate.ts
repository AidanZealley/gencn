import { z } from 'zod'
import { validateSpec, type Catalog, type Spec } from '@json-render/core'
import type { Block } from './block.js'

/** A problem `catalog.validate` can't see. */
export type BlockIssue = {
  severity: 'error'
  code: 'invalid_props' | 'unknown_event' | 'unknown_action'
  elementKey: string
  message: string
}

type CatalogData = {
  components: Record<string, Block>
  actions?: Record<string, unknown>
}

/** A prop written as an expression, such as `{ "$state": "/on" }`. */
const isExpression = (value: unknown) =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value).some((key) => key.startsWith('$'))

/** Parses the props written as literals; expressions resolve at render. */
function parseProps(block: Block, props: Record<string, unknown>) {
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

/**
 * Checks what `catalog.validate` doesn't: each element's props against its
 * block (it only does that for a one-block catalog), its events, and the
 * actions they name. A prop written as an expression is skipped: it only
 * has a value at render time.
 */
export function validateBlocks(catalog: Catalog, spec: Spec): BlockIssue[] {
  const { components, actions = {} } = catalog.data as CatalogData
  const builtIns = catalog.schema.builtInActions?.map((a) => a.name) ?? []
  const issues: BlockIssue[] = []
  const report = (
    code: BlockIssue['code'],
    elementKey: string,
    message: string,
  ) => issues.push({ severity: 'error', code, elementKey, message })

  for (const [key, element] of Object.entries(spec.elements)) {
    const block = components[element.type]
    if (!block) continue // catalog.validate reports unknown types
    const parsed = parseProps(block, element.props ?? {})
    if (!parsed.success) {
      const why = z.prettifyError(parsed.error).replaceAll('\n', ' ')
      report('invalid_props', key, `"${key}" (${element.type}): ${why}`)
    }
    for (const [event, bound] of Object.entries(element.on ?? {})) {
      if (!block.events?.includes(event)) {
        report('unknown_event', key, `"${key}" has no "${event}" event`)
      }
      for (const { action } of [bound].flat()) {
        if (action in actions || builtIns.includes(action)) continue
        report('unknown_action', key, `"${key}" uses unknown "${action}"`)
      }
    }
  }
  return issues
}

/**
 * Every check a spec must pass before it renders: its shape and block
 * names (the catalog's schema), its tree (`validateSpec`) and its blocks
 * (`validateBlocks`). Returns text for the model to fix, or nothing.
 */
export function checkSpec(catalog: Catalog, spec: unknown) {
  const parsed = catalog.zodSchema().safeParse(spec)
  if (!parsed.success) return z.prettifyError(parsed.error)
  const valid = spec as Spec // parsed.data drops fields like `on`
  const errors = [
    ...validateSpec(valid).issues,
    ...validateBlocks(catalog, valid),
  ].filter((issue) => issue.severity === 'error')
  if (errors.length === 0) return undefined
  const lines = errors.map((issue) => `- ${issue.message}`)
  return ['The card spec has errors:', ...lines].join('\n')
}
