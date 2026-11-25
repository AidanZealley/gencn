import {
  defineCatalog,
  type Catalog as JsonRenderCatalog,
} from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'
import type { BlockDef } from './block.js'

/** The one action a view's controls run: a call to one of the host's tools. */
export const CALL_TOOL = 'callTool'

const callToolParams = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
})

/**
 * The blocks an app generates views from, listed one by one: never spread
 * `gencn`, or an update would offer blocks the app hasn't installed.
 * Its React half is `createBlocks(catalog, [...])` from `gencn/react`.
 */
export type Catalog<Defs extends readonly BlockDef[] = readonly BlockDef[]> = {
  blocks: Defs
  names: Defs[number]['name'][]
  /** json-render's catalog over the same blocks, with `callTool`. */
  jsonRender: JsonRenderCatalog
}

/** A catalog of `blocks`. Throws for two blocks with one name. */
export function createCatalog<const Defs extends readonly BlockDef[]>(
  blocks: Defs,
): Catalog<Defs> {
  const names = blocks.map((block) => block.name)
  const twice = names.find((name, index) => names.indexOf(name) !== index)
  if (twice) {
    throw new Error(`The catalog lists ${twice} twice.`)
  }
  // json-render's entry shape, without the name; its types want mutable
  // arrays, and gencn types the blocks itself, so the config is untyped.
  const components = Object.fromEntries(
    blocks.map(({ name, slots, events, ...entry }) => [
      name,
      { ...entry, slots: slots && [...slots], events: events && [...events] },
    ]),
  )
  const jsonRender = defineCatalog(schema, {
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
  return { blocks, names, jsonRender }
}
