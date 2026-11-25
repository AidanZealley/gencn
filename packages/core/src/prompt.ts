import type { z } from 'zod'
import type { BlockDef } from './block.js'
import { CALL_TOOL, type Catalog } from './catalog.js'

type Action = { description?: string; params?: z.ZodType }

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
function blockLine(block: BlockDef) {
  const extras = [
    block.slots?.length && 'Takes children.',
    block.events?.length && `Events: ${block.events.join(', ')}.`,
  ].filter(Boolean)
  return [
    `- ${block.name}: ${typeOf(block.props)} -`,
    block.description,
    ...extras,
  ]
    .join(' ')
    .trim()
}

/**
 * What a model needs to write a view as a tool's arguments: the spec's
 * shape, state and expressions, `callTool` and its rules, refresh, and one
 * line per block, generated from the catalog. Unlike json-render's
 * `prompt()`, it says nothing about streaming patches. Apps put their own
 * framing (what a view is for, when to show one) around it.
 */
export function toolPrompt(catalog: Catalog): string {
  const { actions = {} } = catalog.jsonRender.data as {
    actions?: Record<string, Action>
  }
  const callTool = actions[CALL_TOOL]!
  return [
    'The spec is flat. `root` is the key of the top element. `elements` maps each key to { "type", "props", "children" }, where children lists child keys in screen order ([] for none). Use only the blocks and props below. Show only what you know or a tool returned; image URLs come only from tool results.',
    '',
    'Optional `state` holds data the view reads. A prop can read it with { "$state": "/path" }. A control\'s value can be bound with { "$bindState": "/path" }: it shows that state and writes to it. { "$cond": { "$state": "/path" }, "$then": a, "$else": b } picks a value by whether the state is truthy (add "eq": value to compare). To repeat children for each item of an array in state, give the container "repeat": { "statePath": "/items", "key": "id" }; its children read fields with { "$item": "field" }.',
    '',
    `Controls do things through ${CALL_TOOL}, bound in an element's "on", next to "props": "on": { "press": { "action": "${CALL_TOOL}", "params": { "tool": "<name>", "args": { ... } } } }. ${callTool.description} Params: ${typeOf(callTool.params!)}. Arg values may read state; they're read when the event fires, after a bound control has written its new value. Bind ${CALL_TOOL} only in "on": never in watch or onSuccess. Every control must bind its event.`,
    'A Switch for a device with separate on and off tools binds turnOn and turnOff, one tool each. Bind change only to a tool that takes the new value. A tool that only toggles goes on a Button, never a Switch.',
    '',
    'Optional `refresh` lets the view read its state again from a tool that only reads: { "tool", "args", "from"?, "extract": { "/state/path": { "match", "map"?, "as"? } } }. The tool\'s output is text; "from" is a JSON pointer into it when it\'s JSON (such as "/result"). Each "match" is an RE2 regex over that text whose first group is the value: write it from the output you just read, anchored on the device\'s name so it can\'t match another, e.g. "names: Kitchen Light\\n(?:  .*\\n)*?  state: \'(on|off)\'". "map" turns the text into a value ({ "on": true, "off": false }); "as": "number" reads a number. Set `state` to what the output says now: the view is checked against it.',
    '',
    'Blocks:',
    ...catalog.blocks.map(blockLine),
  ].join('\n')
}
