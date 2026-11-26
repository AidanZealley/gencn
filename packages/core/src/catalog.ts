import type { Catalog as JsonRenderCatalog } from '@json-render/core'
import type { BlockDef } from './block.js'
import { jsonRenderCatalog } from './json-render.js'

export { CALL_TOOL } from './json-render.js'

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
  return { blocks, names, jsonRender: jsonRenderCatalog(blocks) }
}
