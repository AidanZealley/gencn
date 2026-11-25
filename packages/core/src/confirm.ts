import type { ActionBinding, ActionConfirm } from '@json-render/core'
import { CALL_TOOL } from './catalog.js'
import type { Spec } from './spec.js'

/** `binding`, and the bindings it chains, with each `callTool`'s confirm moved. */
function moved(binding: ActionBinding): ActionBinding {
  const { confirm, onSuccess, onError, ...rest } = binding as ActionBinding & {
    onSuccess?: unknown
    onError?: unknown
  }
  const chained = (next: unknown) =>
    next && typeof next === 'object' && 'action' in next
      ? moved(next as ActionBinding)
      : next
  const own =
    confirm && binding.action === CALL_TOOL
      ? { ...rest, params: { ...rest.params, confirm } }
      : { ...rest, ...(confirm && { confirm }) }
  return {
    ...own,
    ...(onSuccess !== undefined && { onSuccess: chained(onSuccess) }),
    ...(onError !== undefined && { onError: chained(onError) }),
  } as ActionBinding
}

/**
 * `spec` with each `callTool` binding's `confirm` moved into its params
 * (`params.confirm`), so json-render never shows its own dialog for it and
 * the view's handler asks instead, drawn by the host. The model writes
 * `confirm` where json-render documents it; views apply this once, when
 * they're created. Pure: `spec` is left as it was.
 */
export function moveConfirms(spec: Spec): Spec {
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
                  Array.isArray(bound) ? bound.map(moved) : moved(bound),
                ]),
              ),
            }
          : element,
      ]),
    ),
  }
}
