import type { ActionBinding } from '@json-render/core'
import { CALL_TOOL } from './catalog.js'
import type { Spec } from './spec.js'

/** `binding`, and the bindings it chains, with each `callTool` prepared. */
function prepared(binding: ActionBinding): ActionBinding {
  const { confirm, onSuccess, onError, ...rest } = binding as ActionBinding & {
    onSuccess?: unknown
    onError?: unknown
  }
  const chained = (next: unknown) =>
    next && typeof next === 'object' && 'action' in next
      ? prepared(next as ActionBinding)
      : next
  const isCall = binding.action === CALL_TOOL
  const own =
    confirm && isCall
      ? { ...rest, params: { ...rest.params, confirm } }
      : { ...rest, ...(confirm && { confirm }) }
  return {
    ...own,
    ...(onSuccess !== undefined && { onSuccess: chained(onSuccess) }),
    ...(onError !== undefined
      ? { onError: chained(onError) }
      : isCall && { onError: { set: {} } }),
  } as ActionBinding
}

/**
 * `spec` with each `callTool` binding, chained ones too, made ready for
 * json-render. Views apply this once, when they're created. Pure: `spec` is
 * left as it was.
 *
 * - `confirm` moves into its params (`params.confirm`), so json-render never
 *   shows its own dialog and the view's handler asks instead, drawn by the
 *   host. The model writes `confirm` where json-render documents it.
 * - A binding without `onError` gets a no-op one (`{ set: {} }`). json-render
 *   rethrows a failed action that has none, and blocks don't await `emit()`,
 *   so each failed, declined or busy press would be an unhandled rejection.
 *   The view's phase already reports it.
 */
export function prepareCalls(spec: Spec): Spec {
  return {
    ...spec,
    elements: Object.fromEntries(
      Object.entries(spec.elements).map(([key, element]) => [
        key,
        element.on
          ? {
              ...element,
              on: Object.fromEntries(
                Object.entries(element.on).map(([event, bound]) => [
                  event,
                  Array.isArray(bound) ? bound.map(prepared) : prepared(bound),
                ]),
              ),
            }
          : element,
      ]),
    ),
  }
}
