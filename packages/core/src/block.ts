import { z } from 'zod'

/**
 * A block's behaviour, in json-render's catalog entry shape plus its name.
 * No React and no styling: the look comes from the registry item an app
 * installs (see `defineBlock` in `gencn/react`).
 */
export type BlockDef<
  Name extends string = string,
  Props extends z.ZodObject = z.ZodObject,
  Events extends readonly string[] = readonly string[],
> = {
  name: Name
  /** What the block does, so the model can match a task to it. */
  description: string
  props: Props
  /** `['default']` when the block takes children. */
  slots?: readonly string[]
  /** Events an element can bind to actions with `on`. All are a person's. */
  events?: Events
  example?: Record<string, unknown>
}

/** A block definition, its name and events kept as literal types. */
export const defineBlockDef = <
  const Name extends string,
  Props extends z.ZodObject,
  const Events extends readonly string[] = readonly [],
>(
  def: BlockDef<Name, Props, Events>,
) => def

/** A block's props after parsing, for typing its view. */
export type PropsOf<D extends BlockDef> = z.output<D['props']>

/** Spacing between children, mapped to classes in each block file. */
export const gap = z.enum(['sm', 'md', 'lg'])
