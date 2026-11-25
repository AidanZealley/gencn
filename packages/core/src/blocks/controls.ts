import { z } from 'zod'
import type { Block } from '../block.js'

export const Switch = {
  description:
    'Turns one thing on or off, such as a light or a setting. ' +
    'Fires change when toggled.',
  props: z.object({
    label: z.string(),
    description: z.string().optional(),
    checked: z.boolean().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['change'],
  example: { label: 'Kitchen light', checked: true },
} satisfies Block

export const Slider = {
  description:
    'Picks a number in a range, such as brightness or volume. ' +
    'Fires change once when the user lets go, not while dragging.',
  props: z.object({
    label: z.string(),
    value: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    unit: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['change'],
  example: { label: 'Brightness', value: 60, min: 0, max: 100, unit: '%' },
} satisfies Block

export const Select = {
  description:
    'Picks one of a few named options, such as a mode or a scene. ' +
    'Fires change when the choice changes.',
  props: z.object({
    label: z.string(),
    options: z.array(z.object({ label: z.string(), value: z.string() })),
    value: z.string().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['change'],
  example: {
    label: 'Mode',
    options: [
      { label: 'Heat', value: 'heat' },
      { label: 'Cool', value: 'cool' },
    ],
    value: 'heat',
  },
} satisfies Block

export const Button = {
  description:
    'Does something once when pressed, such as "Run scene" or ' +
    '"Refresh". Destructive for actions that are hard to undo.',
  props: z.object({
    label: z.string(),
    variant: z
      .enum(['default', 'secondary', 'outline', 'destructive'])
      .optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['press'],
  example: { label: 'Refresh' },
} satisfies Block
