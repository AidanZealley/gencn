import type { z } from 'zod'
import type { Catalog } from '@json-render/core'
import type { Block } from './block.js'

type Action = { description?: string; params?: z.ZodType }

type CatalogData = {
  components: Record<string, Block>
  actions?: Record<string, Action>
}

/** A zod type as a short TypeScript-like type, for the model to read. */
function typeOf(schema: z.ZodType): string {
  const def = schema._zod.def as unknown as Record<string, unknown> & {
    type: string
  }
  switch (def.type) {
    case 'object': {
      const shape = def.shape as Record<string, z.ZodType>
      const fields = Object.entries(shape).map(([key, value]) => {
        const optional = value._zod.def.type === 'optional'
        return `${key}${optional ? '?' : ''}: ${typeOf(value)}`
      })
      return fields.length ? `{ ${fields.join(', ')} }` : '{}'
    }
    case 'optional':
    case 'nullable':
      return typeOf(def.innerType as z.ZodType)
    case 'array':
      return `${typeOf(def.element as z.ZodType)}[]`
    case 'union':
      return (def.options as z.ZodType[]).map(typeOf).join(' | ')
    case 'enum':
      return Object.values(def.entries as Record<string, string>)
        .map((value) => JSON.stringify(value))
        .join(' | ')
    case 'literal':
      return (def.values as unknown[])
        .map((value) => JSON.stringify(value))
        .join(' | ')
    case 'record':
      return `Record<string, ${typeOf(def.valueType as z.ZodType)}>`
    case 'any':
    case 'unknown':
      return 'any'
    default:
      return def.type
  }
}

/** One line per block: its props, what it does, and what it takes. */
function blockLine(name: string, block: Block) {
  const extras = [
    block.slots?.length && 'Takes children.',
    block.events?.length && `Events: ${block.events.join(', ')}.`,
  ].filter(Boolean)
  return [`- ${name}: ${typeOf(block.props)} -`, block.description, ...extras]
    .join(' ')
    .trim()
}

/**
 * What a model needs to write a spec as a tool's arguments: the spec's
 * shape, state and expressions, the catalog's own actions, and one line
 * per block, generated from the catalog. Unlike json-render's `prompt()`,
 * it says nothing about streaming patches. Apps put their own framing
 * (what a card is for, when to show one) around it.
 */
export function toolPrompt(catalog: Catalog): string {
  const { components, actions = {} } = catalog.data as CatalogData
  const blocks = Object.entries(components).map(([name, block]) =>
    blockLine(name, block),
  )
  const actionLines = Object.entries(actions).map(([name, action]) =>
    [
      `- ${name}:`,
      action.description,
      action.params && `Params: ${typeOf(action.params)}.`,
    ]
      .filter(Boolean)
      .join(' '),
  )
  return [
    'The spec is flat. `root` is the key of the top element. `elements` maps each key to { "type", "props", "children" }, where children lists child keys in screen order ([] for none). Use only the blocks and props below.',
    '',
    'Optional `state` holds data the card reads. A prop can read it with { "$state": "/path" }. A control\'s value can be bound with { "$bindState": "/path" }: it shows that state and writes to it. { "$cond": { "$state": "/path" }, "$then": a, "$else": b } picks a value by whether the state is truthy (add "eq": value to compare). To repeat children for each item of an array in state, give the container "repeat": { "statePath": "/items", "key": "id" }; its children read fields with { "$item": "field" }.',
    ...(actionLines.length
      ? [
          '',
          'An element\'s "on" binds its events to actions, next to "props": "on": { "change": { "action": "<name>", "params": { ... } } }. Param values may use the expressions above; they are read when the event fires, after a bound control has written its new value. Actions:',
          ...actionLines,
        ]
      : []),
    '',
    'Blocks:',
    ...blocks,
  ].join('\n')
}
