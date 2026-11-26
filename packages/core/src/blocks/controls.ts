// Blocks a person uses. Each fires events an element binds with "on"; the
// props follow shadcn's Switch, Slider, Select and Button.
import { z } from 'zod'
import { defineBlockDef } from '../block.js'

export const Switch = defineBlockDef({
  name: 'Switch',
  description:
    'Turns one thing on or off, such as a light or a setting. turnOn and ' +
    'turnOff fire for the new position, so bind one tool to each; change ' +
    'fires either way, for a tool that takes the new value.',
  props: z.object({
    label: z.string(),
    description: z.string().optional(),
    checked: z.boolean().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['turnOn', 'turnOff', 'change'],
})

export const Slider = defineBlockDef({
  name: 'Slider',
  description:
    'Sets a number within a range, such as brightness or volume. change ' +
    'fires once, when the person lets go.',
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
})

export const Select = defineBlockDef({
  name: 'Select',
  description:
    'Chooses one of a few named options, such as a mode or a scene. ' +
    'change fires when the choice changes.',
  props: z.object({
    label: z.string(),
    options: z.array(z.object({ label: z.string(), value: z.string() })),
    value: z.string().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['change'],
})

export const Button = defineBlockDef({
  name: 'Button',
  description:
    'Does one thing each time it is pressed, such as running a scene. ' +
    'Destructive for what is hard to undo.',
  props: z.object({
    label: z.string(),
    variant: z
      .enum(['default', 'secondary', 'outline', 'destructive'])
      .optional(),
    disabled: z.boolean().optional(),
  }),
  events: ['press'],
})
