// Layout blocks. Their choices name Tailwind's flex, grid and spacing
// options, which each registry item maps to classes.
import { z } from 'zod'
import { defineBlockDef, gap } from '../block.js'

export const Card = defineBlockDef({
  name: 'Card',
  description:
    'The frame of a view: a bordered panel about one thing, such as a ' +
    'room, a device or a result, usually at the root. Its children sit ' +
    'one under another.',
  // shadcn's CardTitle and CardDescription.
  props: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  slots: ['default'],
})

export const Stack = defineBlockDef({
  name: 'Stack',
  description:
    'Puts its children in a column (the default) or a row. A row with ' +
    'justify "between" pushes a label and its value to either side.',
  props: z.object({
    direction: z.enum(['vertical', 'horizontal']).optional(),
    gap: gap.optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between']).optional(),
  }),
  slots: ['default'],
})

export const Grid = defineBlockDef({
  name: 'Grid',
  description:
    'Puts its children in equal columns, row after row: for several ' +
    'things alike, such as readings or photos.',
  props: z.object({
    columns: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    gap: gap.optional(),
  }),
  slots: ['default'],
})

export const Separator = defineBlockDef({
  name: 'Separator',
  description: 'A thin rule between two groups of content.',
  props: z.object({}),
})
