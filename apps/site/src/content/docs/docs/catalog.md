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

## The prompt

`toolPrompt(catalog)` writes what the model needs: the spec's shape, state and bindings, `callTool`, `refresh`, and one line for each block. Put your own framing around it, such as what views are for and when to show one.

## What `checkSpec` checks

- The tree, block names and props: strict, so the model can't use props a block doesn't have.
- Events, and the actions they're bound to.
- `callTool` only runs from something a person does in an element's `on`, never from `watch`.
- No `confirm`: a view never asks the person. Your app asks inside `onAction` (see [Approval](/gencn/docs/rendering/#approval)).

It returns text written for the model, or `undefined` when the spec passes. Hosts should also check each `callTool` against their real tools and the arguments those tools take.
