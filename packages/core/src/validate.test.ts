import { expect, test } from 'vitest'
import {
  Card,
  Image,
  Stack,
  Switch,
  checkRefresh,
  checkSpec,
  createCatalog,
  extract,
  toolPrompt,
  type Spec,
} from './index.js'

const catalog = createCatalog([Card, Image, Stack, Switch])

// Home Assistant's real GetLiveContext output: JSON around a prose line
// and a YAML list of every device.
const live = JSON.stringify({
  success: true,
  result: [
    'Live Context: An overview of the areas and the devices in this smart home:',
    '- names: Small Dehumidifier',
    '  domain: switch',
    "  state: 'on'",
    '- names: Kitchen Light Switch',
    '  domain: switch',
    "  state: 'off'",
    '  areas: Kitchen',
  ].join('\n'),
})

const view = (): Spec => ({
  root: 'card',
  state: { kitchen: true },
  elements: {
    card: { type: 'Card', props: { title: 'Lights' }, children: ['row'] },
    row: { type: 'Stack', props: { gap: 'sm' }, children: ['kitchen'] },
    kitchen: {
      type: 'Switch',
      props: { label: 'Kitchen', checked: { $bindState: '/kitchen' } },
      on: {
        turnOn: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOn',
            args: { name: 'Kitchen Light Switch' },
          },
        },
        turnOff: {
          action: 'callTool',
          params: {
            tool: 'HassTurnOff',
            args: { name: 'Kitchen Light Switch' },
          },
        },
      },
      children: [],
    },
  },
  refresh: {
    tool: 'GetLiveContext',
    from: '/result',
    extract: {
      '/kitchen': {
        match: "names: Kitchen Light Switch\\n(?:  .*\\n)*?  state: '(on|off)'",
        map: { on: true, off: false },
      },
    },
  },
})

test('a well-formed view passes every check', () => {
  expect(checkSpec(catalog, view())).toBeUndefined()
})

test('catches what json-render lets through, and gencn rules', () => {
  const spec = view()
  spec.elements.kitchen!.props = {
    label: 'Kitchen',
    checked: 'yes',
    className: 'x',
  }
  spec.elements.kitchen!.on!.change = {
    action: 'callTool',
    params: { tool: 'Set' },
  }
  spec.elements.row!.on = { press: { action: 'reboot' } }
  // json-render's own lifecycle stays usable: a chained callTool is fine.
  spec.elements.card!.on = {
    press: {
      action: 'setState',
      params: { statePath: '/x', value: 1 },
      confirm: { title: 'Sure?', message: 'Built-ins draw their own dialog' },
      onSuccess: { action: 'callTool', params: { tool: 'HassTurnOn' } },
    },
  } as never
  // But not one that runs by itself.
  spec.elements.row!.watch = {
    '/kitchen': { action: 'callTool', params: { tool: 'HassTurnOn' } },
  } as never
  const problems = checkSpec(catalog, spec)
  for (const expected of [
    'expected boolean', // strict props
    'className',
    'change and turnOn/turnOff', // a Switch would call twice
    'no "press" event',
    'unknown "reboot"',
    'never in watch', // callTool placement
    'confirm works only on callTool',
  ]) {
    expect(problems).toContain(expected)
  }
})

test('refresh reads HA output and must agree with the initial state', () => {
  const spec = view()
  expect(extract(live, spec.refresh!)).toMatchObject([
    { path: '/kitchen', value: false },
  ])
  // The view says the light is on; the house says off.
  expect(checkRefresh(catalog, spec, live)).toContain(
    'read now false (matched "names: Kitchen Light Switch',
  )
  spec.state = { kitchen: false }
  expect(checkRefresh(catalog, spec, live)).toBeUndefined()
  // A device that isn't there is a miss, never a guess.
  spec.refresh!.extract['/kitchen']!.match =
    "names: Porch\\n  state: '(on|off)'"
  expect(checkRefresh(catalog, spec, live)).toContain('found nothing')
  // Without from, the regexes read the JSON around the text: say where it is.
  delete spec.refresh!.from
  expect(checkRefresh(catalog, spec, live)).toContain(
    'Set "from" to the field holding the text: "/result".',
  )
})

test("scale reads HA's 0-255 brightness as the percentage its tools take", () => {
  // As Aidan's HA reported a ceiling light at full brightness.
  const output =
    "- names: Ceiling Light 1\n  attributes:\n    brightness: '255'\n- names: Ceiling Light 2\n  attributes:\n    brightness: '128'\n"
  const read = (name: string) =>
    extract(output, {
      tool: 'GetLiveContext',
      extract: {
        '/b': {
          match: `names: ${name}\\n(?:  .*\\n)*?    brightness: '(\\d+)'`,
          scale: [255, 100],
        },
      },
    })
  expect(read('Ceiling Light 1')).toMatchObject([{ value: 100 }])
  // 50% set becomes 128 in HA, which reads back as 50.
  expect(read('Ceiling Light 2')).toMatchObject([{ value: 50 }])
})

test('toolPrompt lists each block, callTool and refresh, not json-render streaming', () => {
  const text = toolPrompt(catalog)
  expect(text).toContain(
    '- Switch: { label: string, description?: string, checked?: boolean, disabled?: boolean } -',
  )
  expect(text).toContain('Events: turnOn, turnOff, change.')
  expect(text).toContain('Optional `refresh`')
  expect(text).not.toContain('JSONL')
})
