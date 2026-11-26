---
title: Getting started
description: Install gencn, add blocks from the registry, and render your first view.
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
npx shadcn add @gencn/card-block @gencn/switch-block @gencn/slider-block
```

## Two lists

Your app keeps two lists. The compiler checks that they match.

```ts
// catalog.ts: React-free, used where views are generated
import { Card, Slider, Switch, createCatalog } from 'gencn'

export const catalog = createCatalog([Card, Switch, Slider])
```

```ts
// blocks.ts: used where views are drawn
import { createBlocks } from 'gencn/react'
import { cardBlock } from '@/components/generative/card-block'
import { sliderBlock } from '@/components/generative/slider-block'
import { switchBlock } from '@/components/generative/switch-block'
import { catalog } from './catalog'

export const blocks = createBlocks(catalog, [
  cardBlock,
  switchBlock,
  sliderBlock,
])
```

## Generate

Give the model a tool whose arguments are the view. Describe it with `toolPrompt(catalog)`. Check what comes back with `checkSpec`, and if it fails, return the error text to the model so it can fix the view.

```ts
import { autoFix, checkSpec, toolPrompt, type Spec } from 'gencn'

const description = toolPrompt(catalog)

function showView(args: unknown) {
  const spec = autoFix(args as Spec)
  const problems = checkSpec(catalog, spec)
  if (problems) return { isError: true, text: problems }
  return { spec }
}
```

## Render

```tsx
import { useGencnView } from 'gencn/react'

function View({ spec }: { spec: Spec }) {
  const { view } = useGencnView(spec, { blocks, onAction: runTool })
  return view
}
```

`runTool(tool, args)` runs one of your tools when someone uses a control. See [Rendering](/gencn/docs/rendering/) for its busy states, notices and approval.
