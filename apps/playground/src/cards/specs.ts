import type { Spec } from '@json-render/core'

const cat =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/' +
  'Cat03.jpg/960px-Cat03.jpg'

/** Two light switches and a cat photo: the card Familiar renders first. */
const livingRoom: Spec = {
  root: 'room',
  state: { lights: { floor: true, desk: false } },
  elements: {
    room: {
      type: 'Card',
      props: { title: 'Living room', description: 'Lamps and the cat cam' },
      children: ['lamps', 'divider', 'cat', 'caption'],
    },
    lamps: { type: 'Stack', props: { gap: 'sm' }, children: ['floor', 'desk'] },
    floor: {
      type: 'Switch',
      props: { label: 'Floor lamp', checked: { $bindState: '/lights/floor' } },
      children: [],
    },
    desk: {
      type: 'Switch',
      props: {
        label: 'Desk lamp',
        description: 'Warm white',
        checked: { $bindState: '/lights/desk' },
      },
      children: [],
    },
    divider: { type: 'Separator', props: {}, children: [] },
    cat: {
      type: 'Image',
      props: { src: cat, alt: 'The cat asleep on the sofa', aspect: 'video' },
      children: [],
    },
    caption: {
      type: 'Text',
      props: { text: 'Sofa camera, 2 minutes ago', tone: 'muted' },
      children: [],
    },
  },
}

/** Uses the remaining blocks, state templates and a visible condition. */
const thermostat: Spec = {
  root: 'heating',
  state: { target: 21, mode: 'heat', boost: false },
  elements: {
    heating: {
      type: 'Card',
      props: { title: 'Heating' },
      children: ['header', 'readings', 'divider', 'target', 'mode', 'boost'],
    },
    header: {
      type: 'Stack',
      props: { direction: 'horizontal', justify: 'between' },
      children: ['name', 'status'],
    },
    name: {
      type: 'Heading',
      props: { text: 'Hallway thermostat', level: 3 },
      children: [],
    },
    status: {
      type: 'Badge',
      props: { text: 'Heating', variant: 'secondary' },
      children: [],
    },
    readings: {
      type: 'Grid',
      props: { columns: 2 },
      children: ['now', 'humidity'],
    },
    now: {
      type: 'Stat',
      props: {
        label: 'Now',
        value: 19.5,
        unit: '°C',
        caption: { $template: 'Target ${/target}°C' },
      },
      children: [],
    },
    humidity: {
      type: 'Stat',
      props: { label: 'Humidity', value: 48, unit: '%' },
      children: [],
    },
    divider: { type: 'Separator', props: {}, children: [] },
    target: {
      type: 'Slider',
      props: {
        label: 'Target',
        value: { $bindState: '/target' },
        min: 15,
        max: 28,
        step: 0.5,
        unit: '°C',
      },
      children: [],
    },
    mode: {
      type: 'Select',
      props: {
        label: 'Mode',
        value: { $bindState: '/mode' },
        options: [
          { label: 'Heat', value: 'heat' },
          { label: 'Cool', value: 'cool' },
          { label: 'Auto', value: 'auto' },
        ],
      },
      children: [],
    },
    boost: {
      type: 'Stack',
      props: { direction: 'horizontal', justify: 'between' },
      children: ['boost-button', 'boosting'],
    },
    'boost-button': {
      type: 'Button',
      props: { label: 'Boost for an hour', variant: 'outline' },
      on: {
        press: {
          action: 'setState',
          params: { statePath: '/boost', value: true },
        },
      },
      children: [],
    },
    boosting: {
      type: 'Text',
      props: { text: 'Boosting until 16:30', tone: 'muted' },
      visible: { $state: '/boost' },
      children: [],
    },
  },
}

export const specs = { 'Living room': livingRoom, Thermostat: thermostat }
