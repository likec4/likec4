import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { defineConfig } from 'astro/config'
import starlightHeadingBadges from 'starlight-heading-badges'
import starlightLinksValidator from 'starlight-links-validator'
import { searchForWorkspaceRoot } from 'vite'
import likec4grammar from './likec4.tmLanguage.json' with { type: 'json' }
import structurizr from './structurizr.tmLanguage.json' with { type: 'json' }

const version = process.env.npm_package_version || 'latest'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://likec4.dev',

  integrations: [
    react(),
    starlight({
      title: 'LikeC4',
      description: 'Architecture-as-a-code, toolchain for your architecture diagrams',
      social: {
        github: 'https://github.com/likec4/likec4',
        discord: 'https://discord.gg/86ZSpjKAdA',
      },
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        replacesTitle: true,
      },
      editLink: {
        baseUrl: 'https://github.com/likec4/likec4/edit/main/apps/docs/',
      },
      customCss: [
        // Fontsource files for to regular and semi-bold font weights.
        '@fontsource/ibm-plex-sans/400.css',
        '@fontsource/ibm-plex-sans/500.css',
        '@fontsource/ibm-plex-sans/600.css',
        './src/styles/global.css',
      ],
      sidebar: [
        {
          label: 'Getting started',
          items: [
            {
              label: 'Tutorial',
              link: '/tutorial',
            },
          ],
        },
        {
          label: 'LikeC4',
          autogenerate: { directory: 'dsl' },
        },
        {
          label: 'Examples',
          autogenerate: {
            directory: 'examples',
          },
        },
        {
          label: 'Tooling',
          autogenerate: { directory: 'tooling' },
        },
        {
          label: 'Guides',
          autogenerate: {
            directory: 'guides',
            collapsed: true,
          },
        },
        {
          label: 'Changelog',
          items: [
            {
              label: 'Latest',
              badge: { text: version, variant: 'success' },
              link: `https://github.com/likec4/likec4/releases/tag/v${version}`,
              attrs: {
                target: '_blank',
                style: 'font-weight: 500; font-size: var(--sl-text-sm)',
                rel: 'noopener',
              },
            },
            {
              label: 'Releases',
              link: 'https://github.com/likec4/likec4/releases',
              attrs: {
                target: '_blank',
                style: 'font-weight: 500; font-size: var(--sl-text-sm)',
                rel: 'noopener',
              },
            },
          ],
        },
      ],
      expressiveCode: {
        plugins: [
          pluginLineNumbers(),
          pluginCollapsibleSections(),
        ],
        styleOverrides: {
          borderRadius: '4px',
        },
        defaultProps: {
          // Disable line numbers by default
          showLineNumbers: false,
        },
        shiki: {
          langs: [
            likec4grammar,
            structurizr,
          ],
        },
      },
      pagination: true,
      credits: false,
      components: {
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        Head: './src/components/starlight/Head.astro',
      },
      plugins: [
        starlightHeadingBadges(),
        starlightLinksValidator({
          exclude: [
            '/playground/blank/',
            '/playground/getting-started/',
            '/playground/',
          ],
        }),
      ],
    }),
  ],

  vite: {
    resolve: {
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'likec4/icons': new URL('../../packages/icons', import.meta.url).pathname,
        'likec4/model': new URL('../../packages/likec4/src/model', import.meta.url).pathname,
        // Alias to bundled React components, can't use 'development' condition html#server
        'likec4/react': new URL('../../packages/likec4/react', import.meta.url).pathname,
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    server: {
      fs: {
        // https://vitejs.dev/config/server-options.html#server-fs-allow
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
  },
})
