# gencn

Generative UI built from your own shadcn components. A model writes a
**view** (a [json-render](https://github.com/vercel-labs/json-render) spec)
from the blocks you installed; gencn checks it, and once accepted its
controls call your functions, never the model.

- `gencn` (React-free): block definitions, `createCatalog`,
  `toolPrompt`, `checkSpec`, `checkRefresh`, `extract` and
  `createViewActor`.
- `gencn/react`: `defineBlock`, `createBlocks` and `useGencnView`.

```sh
pnpm add gencn
```

Map the registry in `components.json`, then install blocks with the shadcn
CLI (`npx shadcn add @gencn/switch-block`):

```json
"registries": {
  "@gencn": "https://aidanzealley.github.io/gencn/r/{style}/{name}.json"
}
```

Then keep two lists: `catalog.ts` (`createCatalog([...])`, where views are
generated) and `blocks.ts` (`createBlocks(catalog, [...])`, where they're
drawn). A block missing from either doesn't compile.

```tsx
const { ref, view, busy, notice, problem, refresh } = useGencnView(spec, {
  blocks,
  onAction: run,
  onRead: read,
})
```

`onAction(tool, args)` resolves to `done`, `failed`, `declined` or
`unavailable`; a failed or declined call puts the controls back. A call
that needs approval asks in your own UI, inside `onAction`. `onRead`
returns a read tool's text, which the spec's `refresh` extracts state
from. The hook returns codes, not words: your app words them.

json-render and zod come with gencn. Blocks import `useBoundProp` from
`gencn/react`, and your own blocks' props use the `z` gencn exports, so the
app never needs its own copy. `react` is an optional peer, for
`gencn/react` only: a server-only host never loads React.
