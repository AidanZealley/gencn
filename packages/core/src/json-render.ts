/**
 * Everywhere gencn departs from json-render, in one place, so an upgrade
 * reads this file to see each disagreement. Written against 0.23.2.
 *
 * - The catalog's one action is `callTool`, the host's tools; no others.
 * - Specs may not use `confirm`: a view never asks the person, its host
 *   does, inside `onAction`. Nor may `callTool` run by itself (`watch`).
 * - Each `callTool` binding without `onError` gets a no-op one (`prepare`).
 *
 * `toolPrompt` replaces json-render's `prompt()`, which teaches streaming
 * patches; gencn's model writes a whole spec as a tool's arguments.
 */
import {
  defineCatalog,
  type ActionBinding,
  type Catalog as JsonRenderCatalog,
} from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'
import type { BlockDef } from './block.js'
import { bindingsIn } from './calls.js'
import type { Spec } from './spec.js'

/** The one action a view's controls run: a call to one of the host's tools. */
export const CALL_TOOL = 'callTool'

const callToolParams = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
})

/** json-render's catalog over `blocks`, with `callTool` as its one action. */
export function jsonRenderCatalog(blocks: readonly BlockDef[]) {
  // json-render checks props against a block's schema only when the catalog
  // has one block, and then refuses expressions such as { $state }. Hand it
  // open props for every block, so the check never depends on the count;
  // validateBlocks checks props against their real schemas, expressions
  // allowed.
  const props = z.object({}).catchall(z.unknown())
  // json-render's entry shape, without the name; its types want mutable
  // arrays, and gencn types the blocks itself, so the config is untyped.
  const components = Object.fromEntries(
    blocks.map(({ name, description, slots, events }) => [
      name,
      {
        description,
        props,
        slots: slots && [...slots],
        events: events && [...events],
      },
    ]),
  )
  return defineCatalog(schema, {
    components: components as never,
    actions: {
      [CALL_TOOL]: {
        description:
          "Calls one of the host's tools, by name, when the person uses " +
          'the control. No model runs. tool may be a $cond choosing ' +
          'between names. args must match the tool; a value may read state.',
        params: callToolParams,
      },
    },
  }) as unknown as JsonRenderCatalog
}

/** A json-render feature `spec` uses that gencn refuses, by element. */
export type Rejected = {
  code: 'call_tool_placement' | 'confirm'
  elementKey: string
  message: string
}

/** What `spec` uses of json-render that gencn refuses: text for the model. */
export function rejected(spec: Spec): Rejected[] {
  const found: Rejected[] = []
  for (const [key, element] of Object.entries(spec.elements)) {
    const { on, props, ...rest } = element
    // Anything outside "on", such as watch, runs by itself.
    if (bindingsIn(rest).some(({ action }) => action === CALL_TOOL)) {
      found.push({
        code: 'call_tool_placement',
        elementKey: key,
        message: `"${key}": ${CALL_TOOL} may only be bound in an element's "on" (or what that binding chains, onSuccess and onError), never in watch or anything else that runs by itself.`,
      })
    }
    if (bindingsIn([on, rest]).some((binding) => 'confirm' in binding)) {
      found.push({
        code: 'confirm',
        elementKey: key,
        message: `"${key}": remove "confirm". A view never asks the person; the app decides which calls need approval.`,
      })
    }
  }
  return found
}

/** `binding`, and the bindings it chains, each `callTool` given an `onError`. */
function prepared(binding: ActionBinding): ActionBinding {
  const { onSuccess, onError } = binding as ActionBinding & {
    onSuccess?: unknown
    onError?: unknown
  }
  const chained = (next: unknown) =>
    next && typeof next === 'object' && 'action' in next
      ? prepared(next as ActionBinding)
      : next
  return {
    ...binding,
    ...(onSuccess !== undefined && { onSuccess: chained(onSuccess) }),
    ...(onError !== undefined
      ? { onError: chained(onError) }
      : binding.action === CALL_TOOL && { onError: { set: {} } }),
  } as ActionBinding
}

/**
 * `spec` ready for json-render: each `callTool` binding without `onError`,
 * chained ones too, gets a no-op one (`{ set: {} }`). json-render's
 * `executeAction` rethrows a failed action that has no `onError`, with no
 * option to turn it off, and blocks don't await `emit()`, so each failed,
 * declined or busy press would be an unhandled rejection. The view's phase
 * already reports it. A candidate for an upstream option. Pure.
 */
export function prepare(spec: Spec): Spec {
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
