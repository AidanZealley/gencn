# gencn

Generative UI built from your own shadcn components. An agent composes a
[json-render](https://json-render.dev) spec from a catalog of blocks; each
block's look comes from a shadcn registry item installed into your app.

- `packages/core`: the `gencn` package. Its root entry is React-free:
  block definitions, `createCatalog`, `toolPrompt`, `checkSpec`,
  `checkRefresh`, `extract` and `createViewActor`. `gencn/react` draws
  views: `defineBlock`, `createBlocks`, `useGencnView`, `<GencnView>`.
- `registry`: one shadcn registry item per block (`registry.json`,
  `blocks/*.tsx`). `pnpm build` writes it to `apps/playground/public/r/`,
  flat and under every shadcn style folder.
- `apps/playground`: Vite app that renders hand-written specs against a
  pretend Home Assistant, with the hook and with `<GencnView>`, and serves
  the registry at `/r/`.

```sh
pnpm install
pnpm build   # core, then registry, then playground
pnpm dev     # playground and registry on port 5173
pnpm test
```

## Using it in an app

1. Depend on `gencn` with `file:` (not `link:`, which resolves zod and
   json-render from gencn's own `node_modules`, giving the app two copies):
   `"gencn": "file:../gencn/packages/core"`. Run `pnpm install` again
   after adding files to core.
2. Map the namespace in `components.json`:
   `"registries": { "@gencn": "http://localhost:5173/r/{style}/{name}.json" }`
   and install blocks, dry run first:
   `npx shadcn add @gencn/switch-block --dry-run`. A local file also works:
   `npx shadcn add ../gencn/apps/playground/public/r/base-lyra/switch-block.json`.
3. Keep two lists, as `apps/playground/src/views` does: `catalog.ts`
   (`createCatalog([...])`, React-free, where views are generated) and
   `blocks.ts` (`createBlocks(catalog, [...])`, where they're drawn).

Slider and Select are Base UI only for now, so they're only published under
`base-*` styles.

Licensed under Apache-2.0 (`LICENSE`). The registry blocks are adapted from
`@json-render/shadcn` (Apache-2.0); see `NOTICE`.
