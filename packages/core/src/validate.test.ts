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
  // callTool that would run by itself, after another action.
  spec.elements.card!.on = {
    press: {
      action: 'setState',
      params: { statePath: '/x', value: 1 },
      onSuccess: { action: 'callTool', params: { tool: 'HassTurnOn' } },
    },
  } as never
  const problems = checkSpec(catalog, spec)
  for (const expected of [
    'expected boolean', // strict props
    'className',
    'change and turnOn/turnOff', // a Switch would call twice
    'no "press" event',
    'unknown "reboot"',
    'only be bound directly', // callTool placement
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
