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

1. Install the package and its peers:
   `pnpm add gencn @json-render/core @json-render/react zod`.
2. Map the registry in `components.json`:
   `"registries": { "@gencn": "https://aidanzealley.github.io/gencn/r/{style}/{name}.json" }`,
   then add blocks, dry run first: `npx shadcn add @gencn/switch-block --dry-run`.
3. Keep two lists, as `apps/playground/src/views` does: `catalog.ts`
   (`createCatalog([...])`, React-free, where views are generated) and
   `blocks.ts` (`createBlocks(catalog, [...])`, where they're drawn).

Slider and Select are Base UI only for now, so they're only published under
`base-*` styles.

To try an unpublished change in an app, depend on it with `file:`
(`"gencn": "file:../gencn/packages/core"`), not `link:`, which would give
the app a second zod and json-render. Run `pnpm install` again after adding
files to core, and clear Vite's dependency cache (`node_modules/.vite`)
after each build, since a `file:` change doesn't invalidate it.

Licensed under Apache-2.0 (`LICENSE`).
