import type { Spec } from 'gencn'

// The landing demo's script: what the person asks, what the agent says, and
// the view it generates. Each exchange can switch the app's theme first, to
// show the views already on screen follow it.

/** Real shadcn themes, generated into themes.css by scripts/themes.ts. */
export const themes = [
  { name: 'neutral', label: 'Neutral' },
  { name: 'blue', label: 'Blue' },
  { name: 'orange', label: 'Orange' },
  { name: 'emerald', label: 'Emerald' },
] as const

export type ThemeName = (typeof themes)[number]['name']

export type Exchange = {
  theme?: ThemeName
  ask: string
  reply: string
  view: Spec
}

type Elements = Spec['elements']

/** A spec from a root and its elements; children default to none. */
const view = (
  root: string,
  elements: Record<
    string,
    Omit<Elements[string], 'children'> & { children?: string[] }
  >,
  state?: Record<string, unknown>,
): Spec => ({
  root,
  state,
  elements: Object.fromEntries(
    Object.entries(elements).map(([id, element]) => [
      id,
      { children: [], ...element },
    ]),
  ) as Elements,
})

const call = (tool: string, args: Record<string, unknown> = {}) => ({
  action: 'callTool',
  params: { tool, args },
})

export const exchanges: Exchange[] = [
  {
    ask: 'Dim the living room for a film',
    reply: 'Done. Lamp at 30%, ceiling off.',
    view: view(
      'room',
      {
        room: {
          type: 'Card',
          props: { title: 'Living room', description: '3 lights · 21°C' },
          children: ['ceiling', 'lamp', 'brightness', 'scene'],
        },
        ceiling: {
          type: 'Switch',
          props: { label: 'Ceiling', checked: { $bindState: '/ceiling' } },
          on: {
            turnOn: call('light.turn_on', { name: 'Ceiling' }),
            turnOff: call('light.turn_off', { name: 'Ceiling' }),
          },
        },
        lamp: {
          type: 'Switch',
          props: { label: 'Floor lamp', checked: { $bindState: '/lamp' } },
          on: {
            turnOn: call('light.turn_on', { name: 'Floor lamp' }),
            turnOff: call('light.turn_off', { name: 'Floor lamp' }),
          },
        },
        brightness: {
          type: 'Slider',
          props: {
            label: 'Lamp brightness',
            value: { $bindState: '/brightness' },
            min: 0,
            max: 100,
            step: 5,
            unit: '%',
          },
          on: {
            change: call('light.set', {
              name: 'Floor lamp',
              brightness: { $state: '/brightness' },
            }),
          },
        },
        scene: {
          type: 'Select',
          props: {
            label: 'Scene',
            value: { $bindState: '/scene' },
            options: [
              { label: 'Relax', value: 'relax' },
              { label: 'Film', value: 'film' },
              { label: 'Bright', value: 'bright' },
            ],
          },
          on: {
            change: call('scene.activate', { scene: { $state: '/scene' } }),
          },
        },
      },
      { ceiling: false, lamp: true, brightness: 30, scene: 'film' },
    ),
  },
  {
    theme: 'blue',
    ask: 'How did the deploy go?',
    reply: 'Healthy. Errors are flat since 14:32.',
    view: view('deploy', {
      deploy: {
        type: 'Card',
        props: { title: 'web · production', description: 'a41c9e2 by Sam' },
        children: ['status', 'stats', 'actions'],
      },
      status: {
        type: 'Stack',
        props: { direction: 'horizontal', justify: 'between', align: 'center' },
        children: ['when', 'healthy'],
      },
      when: {
        type: 'Text',
        props: { text: 'Deployed 14:32', tone: 'muted' },
      },
      healthy: {
        type: 'Badge',
        props: { text: 'Healthy', variant: 'secondary' },
      },
      stats: {
        type: 'Grid',
        props: { columns: 3, gap: 'md' },
        children: ['build', 'latency', 'errors'],
      },
      build: { type: 'Stat', props: { label: 'Build', value: 48, unit: 's' } },
      latency: {
        type: 'Stat',
        props: { label: 'p95', value: 212, unit: 'ms' },
      },
      errors: {
        type: 'Stat',
        props: { label: 'Errors', value: 0.2, unit: '%' },
      },
      actions: {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'sm' },
        children: ['logs', 'rollback'],
      },
      logs: {
        type: 'Button',
        props: { label: 'View logs', variant: 'outline' },
        on: { press: call('deploys.logs', { id: 'a41c9e2' }) },
      },
      rollback: {
        type: 'Button',
        props: { label: 'Roll back', variant: 'destructive' },
        on: { press: call('deploys.rollback', { id: 'a41c9e2' }) },
      },
    }),
  },
  {
    theme: 'orange',
    ask: 'Book Nonna’s for Friday, four of us',
    reply: 'They have three times left. Pick one?',
    view: view(
      'booking',
      {
        booking: {
          type: 'Card',
          props: { title: 'Nonna’s', description: 'Friday 28 Nov · 4 people' },
          children: ['time', 'outside', 'note', 'book'],
        },
        time: {
          type: 'Select',
          props: {
            label: 'Time',
            value: { $bindState: '/time' },
            options: [
              { label: '18:30', value: '18:30' },
              { label: '19:45', value: '19:45' },
              { label: '21:00', value: '21:00' },
            ],
          },
        },
        outside: {
          type: 'Switch',
          props: {
            label: 'Sit outside',
            description: 'Heated terrace',
            checked: { $bindState: '/outside' },
          },
        },
        note: {
          type: 'Text',
          props: { text: 'Free to cancel until Thursday.', tone: 'muted' },
        },
        book: {
          type: 'Button',
          props: { label: 'Book table' },
          on: {
            press: call('bookings.create', {
              time: { $state: '/time' },
              outside: { $state: '/outside' },
              people: 4,
            }),
          },
        },
      },
      { time: '19:45', outside: false },
    ),
  },
  {
    theme: 'emerald',
    ask: 'Am I on budget this month?',
    reply: 'Yes, with £560 to spare.',
    view: view('budget', {
      budget: {
        type: 'Card',
        props: { title: 'November', description: '£1,240 of £1,800' },
        children: ['track', 'spend', 'split', 'more'],
      },
      track: {
        type: 'Stack',
        props: { direction: 'horizontal', justify: 'between', align: 'center' },
        children: ['days', 'ontrack'],
      },
      days: { type: 'Text', props: { text: '4 days left', tone: 'muted' } },
      ontrack: { type: 'Badge', props: { text: 'On track' } },
      spend: {
        type: 'Grid',
        props: { columns: 3, gap: 'md' },
        children: ['food', 'travel', 'out'],
      },
      food: { type: 'Stat', props: { label: 'Groceries', value: '£312' } },
      travel: { type: 'Stat', props: { label: 'Transport', value: '£86' } },
      out: { type: 'Stat', props: { label: 'Eating out', value: '£204' } },
      split: { type: 'Separator', props: {} },
      more: {
        type: 'Stack',
        props: { direction: 'horizontal', justify: 'between', align: 'center' },
        children: ['alerts', 'see'],
      },
      alerts: {
        type: 'Text',
        props: { text: 'Alert me at 90%', tone: 'muted' },
      },
      see: {
        type: 'Button',
        props: { label: 'Transactions', variant: 'outline' },
        on: { press: call('bank.transactions', { month: '2026-11' }) },
      },
    }),
  },
]
