// Props adapted from @json-render/shadcn's catalog (Apache-2.0); see NOTICE.
import { z } from 'zod'
import { defineBlockDef } from '../block.js'

export const Heading = defineBlockDef({
  name: 'Heading',
  description:
    'A title for a section. Level 1 is the largest. A Card title ' +
    'usually makes a level 1 heading unnecessary.',
  props: z.object({
    text: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }),
  example: { text: 'Lights', level: 2 },
})

export const Text = defineBlockDef({
  name: 'Text',
  description: 'A paragraph of text. Muted for secondary details.',
  props: z.object({
    text: z.string(),
    tone: z.enum(['default', 'muted']).optional(),
  }),
  example: { text: 'Both lamps are on.' },
})

export const Image = defineBlockDef({
  name: 'Image',
  description:
    'Shows a picture. src must be a URL from a tool result or an ' +
    'existing image; never invent one.',
  props: z.object({
    src: z.string(),
    alt: z.string(),
    aspect: z.enum(['auto', 'square', 'video']).optional(),
  }),
  example: { src: 'https://example.com/cat.jpg', alt: 'A cat' },
})

export const Stat = defineBlockDef({
  name: 'Stat',
  description:
    'A value to read at a glance, such as a temperature or a count, ' +
    'with a label and an optional unit and caption.',
  props: z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    caption: z.string().optional(),
  }),
  example: { label: 'Temperature', value: 21.5, unit: '°C' },
})

export const Badge = defineBlockDef({
  name: 'Badge',
  description:
    'A short status label, such as "Online" or "Low battery". ' +
    'Destructive for problems.',
  props: z.object({
    text: z.string(),
    variant: z
      .enum(['default', 'secondary', 'outline', 'destructive'])
      .optional(),
  }),
  example: { text: 'Online', variant: 'secondary' },
})
