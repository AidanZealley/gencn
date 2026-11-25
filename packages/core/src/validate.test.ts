import { expect, test } from 'vitest'
import { z } from 'zod'
import { defineCatalog, type Spec } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { Card, Image, Stack, Switch } from './index.js'
import { checkSpec, validateBlocks } from './validate.js'

const catalog = defineCatalog(schema, {
  components: { Card, Image, Stack, Switch },
  actions: {
    call_tool: {
      params: z.object({ tool: z.string() }),
      description: 'Calls a tool.',
    },
  },
})

const card = (): Spec => ({
  root: 'card',
  state: { desk: false },
  elements: {
    card: { type: 'Card', props: { title: 'Lamps' }, children: ['row'] },
    row: { type: 'Stack', props: { gap: 'sm' }, children: ['a', 'b'] },
    a: {
      type: 'Switch',
      props: { label: 'Floor', checked: true },
      on: { change: { action: 'call_tool', params: { tool: 'x' } } },
      children: [],
    },
    b: {
      type: 'Switch',
      props: { label: 'Desk', checked: { $bindState: '/desk' } },
      children: [],
    },
  },
})

test('a well-formed card passes every check', () => {
  expect(checkSpec(catalog, card())).toBeUndefined()
})

test('catches what catalog.validate lets through', () => {
  const spec = card()
  spec.elements.a!.props = { label: 'Floor', checked: 'yes', className: 'x' }
  spec.elements.b!.on = { press: { action: 'reboot' } }

  expect(catalog.validate(spec).success).toBe(true)
  const codes = validateBlocks(catalog, spec).map((i) => i.code)
  expect(codes).toEqual(['invalid_props', 'unknown_event', 'unknown_action'])
  expect(checkSpec(catalog, spec)).toContain('expected boolean')
})
