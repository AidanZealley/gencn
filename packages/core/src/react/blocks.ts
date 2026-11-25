import type { ReactNode } from 'react'
import {
  defineRegistry,
  type BaseComponentProps,
  type ComponentRegistry,
} from '@json-render/react'
import type { BlockDef, PropsOf } from '../block.js'
import type { Catalog } from '../catalog.js'

/** A block's installed component: json-render's props, typed from its def. */
export type BlockView<D extends BlockDef> = (
  props: BaseComponentProps<PropsOf<D>>,
) => ReactNode

/** A block def paired with the component an app installed for it. */
export type Block<D extends BlockDef = BlockDef> = {
  def: D
  view: BlockView<D>
}

/** Pairs `def` with `view`, the app's component for it; props typed from `def`. */
export const defineBlock = <const D extends BlockDef>(
  def: D,
  view: BlockView<D>,
): Block<D> => ({ def, view })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = Block<any>
type NameOf<B extends readonly AnyBlock[]> = B[number]['def']['name']
type Missing<C extends Catalog, B extends readonly AnyBlock[]> = Exclude<
  C['names'][number],
  NameOf<B>
>
type Extra<C extends Catalog, B extends readonly AnyBlock[]> = Exclude<
  NameOf<B>,
  C['names'][number]
>

/**
 * Nothing when `B` covers `C` exactly; else a property naming what's
 * wrong, which the compiler shows: `Property '"Missing blocks:"' is
 * missing … required in type '{ "Missing blocks:": "Slider"; }'`.
 */
export type ExactCover<C extends Catalog, B extends readonly AnyBlock[]> = [
  Missing<C, B>,
] extends [never]
  ? [Extra<C, B>] extends [never]
    ? unknown
    : { 'Not in catalog:': Extra<C, B> }
  : { 'Missing blocks:': Missing<C, B> }

/** What renders views: the catalog and json-render's registry of its blocks. */
export type ViewBlocks<C extends Catalog = Catalog> = {
  catalog: C
  registry: ComponentRegistry
}

/**
 * The installed components for every block in `catalog`, and no others:
 * a missing or extra block doesn't compile. Throws for one listed twice.
 */
export function createBlocks<
  C extends Catalog,
  const B extends readonly AnyBlock[],
>(catalog: C, blocks: B & ExactCover<C, B>): ViewBlocks<C> {
  const list = blocks as readonly AnyBlock[]
  const names = list.map((block) => block.def.name)
  const twice = names.find((name, index) => names.indexOf(name) !== index)
  if (twice) {
    throw new Error(`${twice} is listed twice.`)
  }
  const missing = catalog.names.filter((name) => !names.includes(name))
  if (missing.length) {
    throw new Error(`Missing blocks: ${missing.join(', ')}`)
  }
  // Actions are the view's own (see useGencnView), so none are given here.
  const { registry } = defineRegistry(catalog.jsonRender, {
    components: Object.fromEntries(
      list.map(({ def, view }) => [def.name, view]),
    ),
  } as never)
  return { catalog, registry }
}
