import type { Spec as JsonRenderSpec } from '@json-render/core'
import { z } from 'zod'

/** How one state value is read from a refresh's output. */
export type Extraction = {
  /** An RE2 regex; its first group is the value. */
  match: string
  /** The value for each captured text; anything else is unavailable. */
  map?: Record<string, unknown>
  /** The captured text as is (default), or as a number. */
  as?: 'number' | 'text'
  /**
   * `[read, shown]`: a number read in other units than the view uses,
   * such as `[1023, 100]` for a 0–1023 reading shown as a percentage. The
   * value becomes value × shown ÷ read, rounded to a whole number.
   * Implies `as: 'number'`.
   */
  scale?: [number, number]
}

/**
 * How a view reads its state again from its source: a tool, called with
 * `args`, whose output (text) is read with `extract`, one regex per state
 * path. `from` first takes a JSON pointer into the output, when it parses
 * as JSON, such as `/result` for a JSON envelope around text.
 */
export type Refresh = {
  tool: string
  args?: Record<string, unknown>
  from?: string
  /** By state path, such as `/kitchen/on`. */
  extract: Record<string, Extraction>
}

/** A view: a json-render spec, plus how to refresh it, if it can. */
export type Spec = JsonRenderSpec & { refresh?: Refresh }

export const refreshSchema = z.strictObject({
  tool: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
  from: z
    .string()
    .regex(/^(\/.*)?$/, 'from is a JSON pointer, such as "/result"')
    .optional(),
  extract: z
    .record(
      z.string().regex(/^\/./, 'each key is a state path, such as "/on"'),
      z.strictObject({
        match: z.string().min(1),
        map: z.record(z.string(), z.unknown()).optional(),
        as: z.enum(['number', 'text']).optional(),
        scale: z
          .tuple([z.number().positive(), z.number().positive()])
          .optional(),
      }),
    )
    .refine((extract) => Object.keys(extract).length > 0, {
      message: 'extract needs at least one state path',
    }),
})
