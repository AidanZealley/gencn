---
title: Getting started
description: Install gencn, add blocks from the registry, and follow one view from the model to the screen.
---

gencn lets an agent build small interactive UI, called **views**, out of blocks you install from a shadcn registry. A view is drawn with your own shadcn components, so it follows your theme. Its controls call tools you define. The model is never called back.

## Install

```sh
npm install gencn
```

Add gencn's registry to `components.json`:

```json
{
  "registries": {
    "@gencn": "https://aidanzealley.github.io/gencn/r/{style}/{name}.json"
  }
}
```

Then add the blocks you want. Each one installs into `components/generative/`, along with any shadcn components it needs.

```sh
npx shadcn add @gencn/card-block @gencn/switch-block
```

## How it fits together

This page builds one view: a card with a switch for a desk lamp. It goes through five steps, and every snippet below is part of the same app.

1. **Catalog** (`catalog.ts`): which blocks the model may use. Names, props and descriptions, no React.
2. **Show view tool** (server): a tool the model calls to show a view. Its arguments are the view, called a **spec**. The catalog describes the blocks to the model and checks the spec it sends.
3. **The spec**: JSON the model writes. It says which blocks to draw, and which of your tools each control calls.
4. **Blocks** (`blocks.ts`): the components that draw each block, installed into your app. Used in the browser.
5. **`useGencnView`** (browser): draws the spec with your blocks, and calls your tool when someone uses a control.

The catalog and the blocks are two lists of the same blocks, kept apart so the server never imports React. `createBlocks` takes the catalog, so a block in one list but not the other is a type error.

## 1. The catalog

```ts
// catalog.ts
import { Card, Switch, createCatalog } from 'gencn'

export const catalog = createCatalog([Card, Switch])
```

## 2. The show view tool

Give the model a tool named `show_view`. Its description is your own framing around `toolPrompt(catalog)`, which tells the model how to write a spec from these blocks.

When the model calls it, check the spec. If it fails, return the problems to the model so it can fix the view and call again. If it passes, return the spec as the tool's result: that's what your chat UI draws in step 5.

```ts
// server: the show_view tool
import { autoFix, checkSpec, toolPrompt, type Spec } from 'gencn'
import { catalog } from './catalog'

export const showViewTool = {
  name: 'show_view',
  description: `Show the person controls for their devices.\n\n${toolPrompt(catalog)}`,
  inputSchema: { type: 'object' },
}

export function runShowView(input: unknown) {
  const spec = autoFix(input as Spec)
  const problems = checkSpec(catalog, spec)
  if (problems) return { isError: true, text: problems }
  return { spec }
}
```

Register these with whichever model SDK you use. The model also has your app's own tools, here `turn_on` and `turn_off`.

## 3. The spec

Asked about the desk lamp, the model calls `show_view` with this spec. The switch calls `turn_on` or `turn_off` when someone flips it. The model only writes the binding; the model is never called again when someone flips the switch.

```json
{
  "root": "card",
  "state": { "lamp": { "on": true } },
  "elements": {
    "card": {
      "type": "Card",
      "props": { "title": "Desk lamp" },
      "children": ["lamp"]
    },
    "lamp": {
      "type": "Switch",
      "props": { "label": "On", "checked": { "$bindState": "/lamp/on" } },
      "on": {
        "turnOn": {
          "action": "callTool",
          "params": { "tool": "turn_on", "args": { "device": "desk_lamp" } }
        },
        "turnOff": {
          "action": "callTool",
          "params": { "tool": "turn_off", "args": { "device": "desk_lamp" } }
        }
      },
      "children": []
    }
  }
}
```

## 4. The blocks

Pair each block in the catalog with the component you installed for it:

```ts
// blocks.ts
import { createBlocks } from 'gencn/react'
import { cardBlock } from '@/components/generative/card-block'
import { switchBlock } from '@/components/generative/switch-block'
import { catalog } from './catalog'

export const blocks = createBlocks(catalog, [cardBlock, switchBlock])
```

## 5. Draw it

Where your chat UI shows tool results, draw each `show_view` result with `useGencnView`. When someone flips the switch, the view calls `onAction('turn_off', { device: 'desk_lamp' })`. Run the tool and say how it went.

```tsx
// View.tsx
import type { OnAction, Spec } from 'gencn'
import { useGencnView } from 'gencn/react'
import { blocks } from './blocks'

const onAction: OnAction = async (tool, args, { signal }) => {
  const response = await fetch(`/api/tools/${tool}`, {
    method: 'POST',
    body: JSON.stringify(args),
    signal,
  })
  return response.ok
    ? { outcome: 'done' }
    : { outcome: 'failed', message: await response.text() }
}

export function View({ spec }: { spec: Spec }) {
  const { view } = useGencnView(spec, { blocks, onAction })
  return view
}
```

```tsx
// in your chat message, for each show_view result
{
  result.spec && <View key={toolCallId} spec={result.spec} />
}
```

`{ outcome: 'failed' }` flips the switch back. See [Rendering](/gencn/docs/rendering/) for busy states, notices and asking for approval, and [Catalog and blocks](/gencn/docs/catalog/) for adding blocks.
