import { z } from 'zod'
import { defineBlockDef } from '../block.js'

export const Switch = defineBlockDef({
  name: 'Switch',
  description:
    'Turns one thing on or off, such as a light or a setting. Fires ' +
    'turnOn or turnOff for the new state (bind both to on and off tools), ' +
    'and change for either (bind it only to a tool that sets a value).',
  props: z.object({
    label: z.string(),
    description: z.string().optional(),
    checked: z.boolean().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['turnOn', 'turnOff', 'change'],
  example: { label: 'Kitchen light', checked: true },
})

export const Slider = defineBlockDef({
  name: 'Slider',
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
})

export const Select = defineBlockDef({
  name: 'Select',
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
})

export const Button = defineBlockDef({
  name: 'Button',
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
})
