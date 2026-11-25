import type { Spec } from 'gencn'

const cat =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/' +
  'Cat03.jpg/960px-Cat03.jpg'

const device = (name: string, field: string) =>
  `names: ${name}\\n(?:  .*\\n)*?  ${field}: '([^']*)'`

/**
 * Controls over the pretend Home Assistant (see home.ts), refreshed from
 * its GetLiveContext: switches bind turnOn and turnOff, the slider and
 * select call tools that take the value, and each regex anchors on the
 * device's name. `state` is what the house says when the page loads.
 */
const livingRoom: Spec = {
  root: 'room',
  state: {
    desk: { on: true, brightness: 60 },
    porch: { on: false },
    heating: { mode: 'heat' },
  },
  elements: {
    room: {
      type: 'Card',
      props: { title: 'Living room', description: 'Lights and heating' },
      children: [
        'desk',
        'brightness',
        'porch',
        'divider',
        'mode',
        'off',
        'cat',
      ],
    },
    desk: {
      type: 'Switch',
      props: { label: 'Desk lamp', checked: { $bindState: '/desk/on' } },
      on: {
        turnOn: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOn',
            args: { name: 'Desk Lamp', domain: ['light'] },
          },
        },
        turnOff: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOff',
            args: { name: 'Desk Lamp', domain: ['light'] },
          },
        },
      },
      children: [],
    },
    brightness: {
      type: 'Slider',
      props: {
        label: 'Brightness',
        value: { $bindState: '/desk/brightness' },
        min: 0,
        max: 100,
        step: 5,
        unit: '%',
      },
      on: {
        change: {
          action: 'callTool',
          params: {
            tool: 'HassLightSet',
            args: {
              name: 'Desk Lamp',
              brightness: { $state: '/desk/brightness' },
            },
          },
        },
      },
      children: [],
    },
    porch: {
      type: 'Switch',
      props: {
        label: 'Porch light',
        description: 'Often offline: its calls fail',
        checked: { $bindState: '/porch/on' },
      },
      on: {
        turnOn: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOn',
            args: { name: 'Porch Light', domain: ['light'] },
          },
        },
        turnOff: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOff',
            args: { name: 'Porch Light', domain: ['light'] },
          },
        },
      },
      children: [],
    },
    divider: { type: 'Separator', props: {}, children: [] },
    mode: {
      type: 'Select',
      props: {
        label: 'Heating (asks first)',
        value: { $bindState: '/heating/mode' },
        options: [
          { label: 'Off', value: 'off' },
          { label: 'Heat', value: 'heat' },
          { label: 'Cool', value: 'cool' },
          { label: 'Auto', value: 'auto' },
        ],
      },
      on: {
        change: {
          action: 'callTool',
          params: {
            tool: 'HassClimateSetMode',
            args: { name: 'Thermostat', mode: { $state: '/heating/mode' } },
          },
        },
      },
      children: [],
    },
    // json-render's own lifecycle: confirm first, then onSuccess sets the
    // switch, since a button has no bound state of its own.
    off: {
      type: 'Button',
      props: { label: 'Lamp off for the night', variant: 'outline' },
      on: {
        press: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOff',
            args: { name: 'Desk Lamp', domain: ['light'] },
          },
          confirm: {
            title: 'Turn the desk lamp off?',
            message: 'It is at ${/desk/brightness}%.',
            confirmLabel: 'Turn off',
          },
          onSuccess: { set: { '/desk/on': false } },
        },
      },
      children: [],
    },
    cat: {
      type: 'Image',
      props: { src: cat, alt: 'The cat asleep on the sofa', aspect: 'video' },
      children: [],
    },
  },
  refresh: {
    tool: 'GetLiveContext',
    from: '/result',
    extract: {
      '/desk/on': {
        match: device('Desk Lamp', 'state'),
        map: { on: true, off: false },
      },
      '/desk/brightness': {
        match: device('Desk Lamp', '  brightness'),
        as: 'number',
      },
      '/porch/on': {
        match: device('Porch Light', 'state'),
        map: { on: true, off: false },
      },
      '/heating/mode': { match: device('Thermostat', 'state') },
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
