---
title: Catalog and blocks
description: What a block is, how the catalog and the installed blocks pair up, and what checkSpec enforces.
---

A **block** has two halves:

- **Its definition** comes from `gencn`: a name, a description written for the model, props (zod) and events. It contains no React.
- **Its component** is installed from the registry into `components/generative/`. The file is yours to edit, like any shadcn component.

## The catalog

`createCatalog([...])` lists the blocks your views can use. List them one by one, so an update to gencn never offers the model a block you haven't installed. The catalog is React-free, so a server can import it.

`createBlocks(catalog, [...])` pairs each definition with its installed component. A block missing from either list is a type error:

```
Property '"Missing blocks:"' is missing … { "Missing blocks:": "Slider" }
```

## Adding a block

1. `npx shadcn add @gencn/select-block`
2. Add `Select` to `catalog.ts`.
3. Add `selectBlock` to `blocks.ts`.

## Writing your own block

Define its React-free half with `defineBlockDef`, and its props with the `z` gencn exports, so your schemas and gencn's share one zod. Put it where the catalog can import it:

```ts
// rating.ts
import { defineBlockDef, z } from 'gencn'

export const Rating = defineBlockDef({
  name: 'Rating',
  description: 'Picks a score from 1 to 5, such as for a review.',
  props: z.object({
    label: z.string(),
    value: z.number().int().min(1).max(5).optional(),
  }),
  events: ['change'],
})
```

Then draw it with `defineBlock`, which types the component's props from the definition:

```tsx
// components/generative/rating-block.tsx
import { defineBlock, useBoundProp } from 'gencn/react'
import { Rating } from '@/rating'

export const ratingBlock = defineBlock(Rating, ({ props, bindings, emit }) => {
  const [value, setValue] = useBoundProp(props.value, bindings?.value)
  return (
    <fieldset>
      <legend>{props.label}</legend>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          aria-pressed={value === score}
          onClick={() => {
            setValue(score)
            emit('change')
          }}
        >
          {score}
        </button>
      ))}
    </fieldset>
  )
})
```

Add `Rating` to the catalog and `ratingBlock` to the blocks, like any other.

## The prompt

`toolPrompt(catalog)` writes what the model needs: the spec's shape, state and bindings, `callTool`, `refresh`, and one line for each block. Put your own framing around it, such as what views are for and when to show one.

## What `checkSpec` checks

- The tree, block names and props: strict, so the model can't use props a block doesn't have.
- Events, and the actions they're bound to.
- `callTool` only runs from something a person does in an element's `on`, never from `watch`.
- No `confirm`: a view never asks the person. Your app asks inside `onAction` (see [Approval](/gencn/docs/rendering/#approval)).

It returns text written for the model, or `undefined` when the spec passes. Hosts should also check each `callTool` against their real tools and the arguments those tools take, with [`toolCalls`](#toolcallsspec).

## API reference

### `createCatalog(blocks)`

From `gencn`. Takes an array of block definitions and returns a `Catalog`. Throws if two blocks share a name.

| Field        | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| `blocks`     | The definitions, as given.                                                                               |
| `names`      | Their names.                                                                                             |
| `jsonRender` | json-render's catalog of the same blocks, with `callTool`. Its props are open: gencn checks them itself. |

### `createBlocks(catalog, blocks)`

From `gencn/react`. Takes the catalog and an array of installed blocks (from `defineBlock`), and returns `ViewBlocks`, which `useGencnView` draws with: `{ catalog, registry }`, where `registry` is json-render's. A block missing from either list doesn't compile (the `ExactCover` type does that), and a block listed twice throws.

### `defineBlockDef(def)`

From `gencn`. Returns `def`, typed as a `BlockDef`.

| Field         | Type          | Description                                                           |
| ------------- | ------------- | --------------------------------------------------------------------- |
| `name`        | `string`      | What specs call it, such as `Rating`. Unique in a catalog.            |
| `description` | `string`      | What it's for, written for the model. It goes in `toolPrompt`.        |
| `props`       | `z.ZodObject` | Its props. Make a prop `.optional()` when the model may leave it out. |
| `slots`       | `string[]?`   | `['default']` when it takes children.                                 |
| `events`      | `string[]?`   | What a person can do with it, which a spec binds to actions in `on`.  |

`gap` is the `'sm' | 'md' | 'lg'` enum gencn's layout blocks use for spacing, for blocks of your own to match. `PropsOf<typeof Rating>` is a definition's props after parsing.

### `defineBlock(def, component)`

From `gencn/react`. Pairs a definition with its component, and returns a `Block`. The component (a `BlockView`) gets json-render's props:

| Prop       | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `props`    | The element's props, with expressions resolved, typed from the definition.        |
| `children` | The element's children, drawn, for a block with slots.                            |
| `emit`     | `emit(event)` fires one of the block's events, running what the spec bound to it. |
| `bindings` | For each prop written as `{ "$bindState": "/path" }`, its state path.             |

### `useBoundProp(value, path)`

From `gencn/react`. For a prop the spec may bind to state. Pass the prop and its path from `bindings`. Returns `[value, setValue]`, where `setValue` writes to the view's state. A block that also works unbound keeps its own state when there's no path, as `switch-block` does.

### `toolPrompt(catalog)`

From `gencn`. Returns the text that teaches the model to write a spec from the catalog's blocks.

### `autoFix(spec)`

From `gencn`. Returns `spec` with json-render's safe fixes applied, such as props written in the wrong place. It never drops anything. Run it before `checkSpec`.

### `checkSpec(catalog, spec)`

From `gencn`. Returns text for the model describing every problem, or `undefined` when the spec passes. `useGencnView` runs it too, and refuses a spec that fails with `invalid-spec`.

`validateBlocks(catalog, spec)` is the part of `checkSpec` that checks blocks and gencn's own rules. It returns `BlockIssue`s, each with a `code`, an `elementKey` and a `message`, for when you'd rather handle problems as data.

### `toolCalls(spec)`

From `gencn`. Lists every `callTool` binding in a spec, as `ToolCall`s:

| Field     | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `element` | The element's key.                                                   |
| `event`   | The event it's bound to.                                             |
| `tools`   | Every tool it can call. Undefined when the tool name isn't readable. |
| `args`    | The arguments, as written, expressions included.                     |

`viewTools(spec)` lists every tool a view can call or read, once each. Use it to check that they all exist before you show the view.

### Types and constants

- `Spec`: a view. json-render's spec, plus an optional [`refresh`](/gencn/docs/refresh/).
- `Blocks` and `BlockName`: every block gencn defines, and their names, as types.
- `CALL_TOOL`: `'callTool'`, the one action a view's controls can bind.
- `isExpression(value)`: whether a prop's value is an expression, such as `{ "$state": "/on" }`, rather than a literal.
- `z`: gencn's copy of zod.
