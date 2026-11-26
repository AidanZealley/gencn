// Blocks that show things. Variants are shadcn's own (Badge's cva).
import { z } from 'zod'
import { defineBlockDef } from '../block.js'

const badgeVariant = z.enum(['default', 'secondary', 'outline', 'destructive'])

export const Heading = defineBlockDef({
  name: 'Heading',
  description:
    'Names a section. Level 1 is biggest; under a Card that has a title, ' +
    'start at 2.',
  props: z.object({
    text: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }),
})

export const Text = defineBlockDef({
  name: 'Text',
  description: 'A sentence or paragraph. Tone "muted" for side details.',
  props: z.object({
    text: z.string(),
    tone: z.enum(['default', 'muted']).optional(),
  }),
})

export const Image = defineBlockDef({
  name: 'Image',
  description:
    'A picture from a URL that a tool returned or that already exists. ' +
    'Never make one up. Aspect crops it (Tailwind aspect-square or ' +
    'aspect-video); auto keeps its own shape.',
  props: z.object({
    src: z.string(),
    alt: z.string(),
    aspect: z.enum(['auto', 'square', 'video']).optional(),
  }),
})

export const Stat = defineBlockDef({
  name: 'Stat',
  description:
    'One reading to take in at a glance, such as a temperature or a ' +
    'count: a label, the value, and an optional unit and caption.',
  props: z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    caption: z.string().optional(),
  }),
})

export const Badge = defineBlockDef({
  name: 'Badge',
  description:
    'A few words of status, such as "Online" or "Low battery"; ' +
    'destructive for something wrong.',
  props: z.object({
    text: z.string(),
    variant: badgeVariant.optional(),
  }),
})
