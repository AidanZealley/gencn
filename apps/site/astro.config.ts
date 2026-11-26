import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const repository = 'https://github.com/AidanZealley/gencn'

// GitHub Pages serves this project site from /gencn/. Links include that
// base; `pnpm build` fails on any that don't resolve. The registry
// (public/r) and the playground and landing demo (public/playground) are
// built into public/ by `pnpm embeds`.
export default defineConfig({
  site: 'https://aidanzealley.github.io',
  base: '/gencn',
  trailingSlash: 'always',
  vite: {
    plugins: [
      {
        // GitHub Pages serves public/playground/index.html at the folder URL;
        // Astro's dev server doesn't. Astro has removed the base by now.
        name: 'serve-playground-index',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((request, _response, next) => {
            request.url = request.url?.replace(
              /^(\/playground\/)(?=\?|$)/,
              '$1index.html',
            )
            next()
          })
        },
      },
    ],
  },
  integrations: [
    starlight({
      title: 'gencn',
      description:
        "Generative UI that's built from your own shadcn components.",
      logo: { src: './src/landing/gencn-lockup.svg', replacesTitle: true },
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: repository },
        {
          icon: 'npm',
          label: 'npm',
          href: 'https://www.npmjs.com/package/gencn',
        },
      ],
      editLink: { baseUrl: `${repository}/edit/main/apps/site/` },
      customCss: [
        '@fontsource-variable/geist',
        '@fontsource-variable/geist-mono',
        './src/styles/theme.css',
      ],
      sidebar: [
        {
          label: 'Docs',
          items: [
            'docs/getting-started',
            'docs/catalog',
            'docs/rendering',
            'docs/refresh',
            'docs/blocks',
            'docs/playground',
          ],
        },
      ],
    }),
  ],
})
