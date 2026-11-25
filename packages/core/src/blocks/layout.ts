// Props adapted from @json-render/shadcn's catalog (Apache-2.0); see NOTICE.
import { z } from 'zod'
import { defineBlockDef, gap } from '../block.js'

export const Card = defineBlockDef({
  name: 'Card',
  description:
    'A bordered surface for one subject, such as a device, a room or ' +
    'a result. Usually the root. Children stack vertically.',
  props: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  slots: ['default'],
  example: { title: 'Living room' },
})

export const Stack = defineBlockDef({
  name: 'Stack',
  description:
    'Arranges children in a row or column. Use a row with ' +
    'justify "between" for a label on the left and a value on the right.',
  props: z.object({
    direction: z.enum(['vertical', 'horizontal']).optional(),
    gap: gap.optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between']).optional(),
  }),
  slots: ['default'],
  example: { direction: 'vertical', gap: 'md' },
})

export const Grid = defineBlockDef({
  name: 'Grid',
  description:
    'Lays children out in equal columns, filling row by row. ' +
    'For several things of the same kind, such as stats or photos.',
  props: z.object({
    columns: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    gap: gap.optional(),
  }),
  slots: ['default'],
  example: { columns: 2, gap: 'md' },
})

export const Separator = defineBlockDef({
  name: 'Separator',
  description: 'A horizontal line between groups of content.',
  props: z.object({}),
})
