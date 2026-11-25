import { z } from 'zod'

/**
 * A block's behaviour, in json-render's catalog entry shape. No React and
 * no styling: the look comes from the registry item an app installs.
 */
export type Block = {
  /** What the block does, so the model can match a task to it. */
  description: string
  props: z.ZodObject
  /** `['default']` when the block takes children. */
  slots?: string[]
  /** Events an element can bind to actions with `on`. */
  events?: string[]
  example?: Record<string, unknown>
}

/** Spacing between children, mapped to classes in each block file. */
export const gap = z.enum(['sm', 'md', 'lg'])
