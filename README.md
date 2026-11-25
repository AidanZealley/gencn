# gencn

Generative UI built from your own shadcn components. An agent composes a
[json-render](https://json-render.dev) spec from a catalog of blocks; each
block's look comes from a shadcn registry item installed into your app.

- `packages/core`: `@gencn/core`. Block definitions (behaviour description,
  zod props, events) and `checkSpec`. No React. `zod` and
  `@json-render/core` are peer dependencies.
- `registry`: one shadcn registry item per block (`registry.json`,
  `blocks/*.tsx`). `pnpm build` writes it to `apps/playground/public/r/`,
  flat and under every shadcn style folder.
- `apps/playground`: Vite app that installs the blocks through the shadcn CLI,
  renders hand-written specs and serves the registry at `/r/`.

```sh
pnpm install
pnpm build   # core, then registry, then playground
pnpm dev     # playground and registry on port 5173
pnpm test
```

## Using it in an app

1. Depend on `@gencn/core` with `file:` (not `link:`, which resolves zod and
   json-render from gencn's own `node_modules`, giving the app two copies):
   `"@gencn/core": "file:../gencn/packages/core"`. Run `pnpm install` again
   after adding files to core.
2. Map the namespace in `components.json`:
   `"registries": { "@gencn": "http://localhost:5173/r/{style}/{name}.json" }`
   and install blocks, dry run first:
   `npx shadcn add @gencn/switch-block --dry-run`. A local file also works:
   `npx shadcn add ../gencn/apps/playground/public/r/base-lyra/switch-block.json`.
3. List the blocks you installed in your catalog and map each to its
   component with `defineRegistry`, as `apps/playground/src/cards` does.

Slider and Select are Base UI only for now, so they're only published under
`base-*` styles.

The registry blocks are adapted from `@json-render/shadcn` (Apache-2.0); see
`registry/NOTICE`.
