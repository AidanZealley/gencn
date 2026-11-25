# gencn

Generative UI built from your own shadcn components. A model writes a
**view** (a [json-render](https://github.com/vercel-labs/json-render) spec)
from the blocks you installed; gencn checks it, and once accepted its
controls call your functions, never the model.

- `gencn` (React-free): block definitions, `createCatalog`,
  `toolPrompt`, `checkSpec`, `checkRefresh`, `extract` and
  `createViewActor`.
- `gencn/react`: `defineBlock`, `createBlocks`, `useGencnView` and
  a plain `<GencnView>`.

Install blocks with the shadcn CLI (`npx shadcn add @gencn/switch-block`),
then keep two lists: `catalog.ts` (`createCatalog([...])`, where views are
generated) and `blocks.ts` (`createBlocks(catalog, [...])`, where they're
drawn). A block missing from either doesn't compile.

```tsx
<GencnView spec={spec} blocks={blocks} onAction={run} onRead={read} />
```

`onAction(tool, args)` resolves to `done`, `failed`, `unavailable` or
`ask`; a failed or declined call puts the controls back. `onRead` returns
a read tool's text, which the spec's `refresh` extracts state from.
