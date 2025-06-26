import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { LikeC4VitePlugin } from 'likec4/vite-plugin'
import starlightHeadingBadges from 'starlight-heading-badges'
import starlightImageZoom from 'starlight-image-zoom'
import starlightLinksValidator from 'starlight-links-validator'

const version = process.env.npm_package_version || 'latest'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://likec4.dev',

  integrations: [
    react(),
    starlight({
      plugins: [
        starlightImageZoom(),
        starlightHeadingBadges(),
        starlightLinksValidator({
          exclude: [
            '/playground/blank/',
            '/playground/getting-started/',
            '/playground/',
          ],
        }),
      ],
      title: 'LikeC4',
      description: 'Architecture-as-a-code, toolchain for your architecture diagrams',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/likec4/likec4' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/86ZSpjKAdA' },
      ],
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        replacesTitle: true,
      },
      editLink: {
        baseUrl: 'https://github.com/likec4/likec4/edit/main/apps/docs/',
      },
      customCss: [
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
          label: 'Showcases',
          autogenerate: {
            directory: 'showcases',
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
                style: 'font-size: var(--sl-text-sm)',
                rel: 'noopener',
              },
            },
            {
              label: 'llms.txt',
              link: `/llms.txt`,
              attrs: {
                target: '_blank',
                style: 'font-size: var(--sl-text-xs)',
              },
            },
            {
              label: 'llms-full.txt',
              link: `/llms-full.txt`,
              attrs: {
                target: '_blank',
                style: 'font-size: var(--sl-text-xs)',
              },
            },
          ],
        },
      ],
      pagination: true,
      credits: false,
      components: {
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        Head: './src/components/starlight/Head.astro',
      },
    }),
  ],

  experimental: {
    contentIntellisense: true,
  },

  vite: {
    resolve: {
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'likec4/icons': new URL('../../packages/icons', import.meta.url).pathname,
        'likec4/model': new URL('../../packages/likec4/src/model', import.meta.url).pathname,
        // Alias to bundled React components, can't use 'development' condition
        'likec4/react': new URL('../../packages/likec4/react/index.mjs', import.meta.url).pathname,
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    plugins: [
      LikeC4VitePlugin({
        workspace: 'src/components',
      }),
    ],
  },
})
