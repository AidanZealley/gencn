import { expect, test } from 'vitest'
import { Card, Switch, createCatalog } from '../index.js'
import { createBlocks, defineBlock } from './blocks.js'

const catalog = createCatalog([Card, Switch])
const card = defineBlock(Card, ({ props }) => props.title)
const toggle = defineBlock(Switch, ({ props }) => props.label)

test('blocks must cover the catalog exactly', () => {
  expect(createBlocks(catalog, [card, toggle]).registry).toHaveProperty(
    'Switch',
  )
  // @ts-expect-error { 'Missing blocks:': 'Switch' }
  expect(() => createBlocks(catalog, [card])).toThrow('Missing blocks: Switch')
  // @ts-expect-error { 'Not in catalog:': 'Switch' }
  createBlocks(createCatalog([Card]), [card, toggle])
  expect(() => createBlocks(catalog, [card, toggle, toggle])).toThrow('twice')
})
