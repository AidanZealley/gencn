# gencn

Generative UI built from your own shadcn components. An agent composes a
[json-render](https://json-render.dev) spec from a catalog of blocks; each
block's look comes from a shadcn registry item installed into your app.

- `packages/core`: the `gencn` package. Its root entry is React-free:
  block definitions, `createCatalog`, `toolPrompt`, `checkSpec`,
  `checkRefresh`, `extract` and `createViewActor`. `gencn/react` draws
  views: `defineBlock`, `createBlocks`, `useGencnView`, `<GencnView>`.
- `registry`: one shadcn registry item per block (`registry.json`,
  `blocks/*.tsx`). Its build writes to `apps/site/public/r/`, flat and
  under every shadcn style folder.
- `apps/playground`: Vite app that renders hand-written specs against a
  pretend Home Assistant, with the hook and with `<GencnView>`. Its
  `demo.html` is the landing page's demo, a scripted chat played through
  real shadcn themes (`scripts/themes.ts` fetches them into
  `src/demo/themes.css`).
- `apps/site`: Astro + Starlight. The landing page and docs, deployed to
  GitHub Pages at https://aidanzealley.github.io/gencn by
  `.github/workflows/site.yml`, with the registry at `/r/` and the
  playground at `/playground/`.

```sh
pnpm install
pnpm build      # core, then registry and playground into the site, then the site
pnpm dev        # playground on port 5173 (the demo at /demo.html)
pnpm dev:site   # the site, with the registry and playground built into it
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

Blocks are published for Base UI (`base-*` styles) and Radix (`radix-*`,
`new-york`, `default`); Slider and Select for Base UI only. React Aria styles
aren't published yet.

To try an unpublished change in an app, depend on it with `file:`
(`"gencn": "file:../gencn/packages/core"`), not `link:`, which would give
the app a second zod and json-render. Run `pnpm install` again after adding
files to core, and clear Vite's dependency cache (`node_modules/.vite`)
after each build, since a `file:` change doesn't invalidate it.

Licensed under Apache-2.0 (`LICENSE`).
