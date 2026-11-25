import type { Spec } from './spec.js'
import { CALL_TOOL } from './catalog.js'

/** One `callTool` binding in a spec, as written. */
export type ToolCall = {
  element: string
  event: string
  /**
   * Every tool it can call: its name, or each name of a `$cond`.
   * Undefined when `tool` is anything else, which `checkSpec` refuses.
   */
  tools?: string[]
  /** As written: literals, or expressions read when the event fires. */
  args: unknown
}

type Binding = Record<string, unknown> & {
  action: string
  params?: Record<string, unknown>
}

/**
 * Every action binding in `value` and what each chains (`onSuccess`,
 * `onError`), at any depth. A binding's params are data, never searched.
 */
export function bindingsIn(value: unknown): Binding[] {
  if (Array.isArray(value)) return value.flatMap(bindingsIn)
  if (typeof value !== 'object' || value === null) return []
  if (typeof (value as { action?: unknown }).action === 'string') {
    const binding = value as Binding
    return [
      binding,
      ...bindingsIn(binding.onSuccess),
      ...bindingsIn(binding.onError),
    ]
  }
  return Object.values(value).flatMap(bindingsIn)
}

/** Everywhere in `spec` an action can be bound: not state, props or refresh. */
export const bindable = (spec: Spec) => ({
  ...spec,
  state: undefined,
  refresh: undefined,
  elements: Object.fromEntries(
    Object.entries(spec.elements).map(([key, element]) => [
      key,
      { ...element, props: undefined },
    ]),
  ),
})

/** A tool written as a name, or a `$cond` between names: each name. */
function namesOf(tool: unknown): string[] | undefined {
  if (typeof tool === 'string') return [tool]
  if (typeof tool !== 'object' || tool === null || !('$cond' in tool)) {
    return undefined
  }
  const { $then, $else } = tool as { $then?: unknown; $else?: unknown }
  const then = namesOf($then)
  const otherwise = namesOf($else)
  return then && otherwise ? [...then, ...otherwise] : undefined
}

/**
 * Every `callTool` binding on an element's events, and those they chain
 * (`onSuccess`, `onError`), in element order: what a host checks against
 * its tools when a view is generated.
 */
export function toolCalls(spec: Spec): ToolCall[] {
  return Object.entries(spec.elements).flatMap(([element, { on }]) =>
    Object.entries(on ?? {}).flatMap(([event, bound]) =>
      bindingsIn(bound)
        .filter(({ action }) => action === CALL_TOOL)
        .map(({ params }) => ({
          element,
          event,
          tools: namesOf(params?.tool),
          args: params?.args ?? {},
        })),
    ),
  )
}

/** Every tool a view can call or read, each once. */
export const viewTools = (spec: Spec) => [
  ...new Set([
    ...toolCalls(spec).flatMap((call) => call.tools ?? []),
    ...(spec.refresh ? [spec.refresh.tool] : []),
  ]),
]
