import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import skills from 'astro-skills'
import { defineConfig } from 'astro/config'
import starlightHeadingBadges from 'starlight-heading-badges'
// import starlightImageZoom from 'starlight-image-zoom'
import starlightLinksValidator from 'starlight-links-validator'

const version = process.env.npm_package_version || 'latest'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://likec4.dev',

  // Moved pages: keep old URLs working
  redirects: {
    '/dsl/notations/': '/dsl/views/notations/',
    '/pt-br/dsl/notations/': '/pt-br/dsl/views/notations/',
    '/dsl/config/': '/config/',
    '/pt-br/dsl/config/': '/pt-br/config/',
    '/dsl/config/multi-projects/': '/config/multi-projects/',
    '/pt-br/dsl/config/multi-projects/': '/pt-br/config/multi-projects/',
    '/dsl/config/programmatic/': '/config/',
    '/pt-br/dsl/config/programmatic/': '/pt-br/config/',
    '/dsl/config/app-config/': '/tooling/app-config/',
    '/dsl/config/customization/': '/tooling/customization/',
    '/tooling/code-generation/webcomponent/': '/tooling/web-components/',
    '/pt-br/tooling/code-generation/webcomponent/': '/pt-br/tooling/web-components/',
    '/tooling/code-generation/react/': '/tooling/react/',
    '/pt-br/tooling/code-generation/react/': '/pt-br/tooling/react/',
    '/guides/static-website/': '/guides/publish/',
    '/pt-br/guides/static-website/': '/pt-br/guides/publish/',
    '/guides/deploy-github-pages/': '/guides/publish/',
    '/pt-br/guides/deploy-github-pages/': '/pt-br/guides/publish/',
  },

  integrations: [
    react(),
    starlight({
      plugins: [
        // starlightImageZoom(),
        starlightHeadingBadges(),
        starlightLinksValidator({
          exclude: [
            '/playground/blank/',
            '/playground/getting-started/',
            '/playground/',
          ],
        }),
      ],
      routeMiddleware: './src/routeData.ts',
      title: 'LikeC4',
      description: 'Architecture-as-a-code, toolchain for your architecture diagrams',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        'pt-br': {
          label: 'Português (Brasil)',
          lang: 'pt-BR',
        },
      },
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
        '@fontsource-variable/ibm-plex-sans/index.css',
        './src/styles/global.css',
      ],
      sidebar: [
        {
          label: 'Getting started',
          translations: { 'pt-BR': 'Primeiros passos' },
          items: [
            {
              label: 'Tutorial',
              slug: 'tutorial',
            },
            { slug: 'tooling/editors' },
          ],
        },
        {
          label: 'LikeC4',
          items: [{ autogenerate: { directory: 'dsl' } }],
        },
        {
          label: 'Project setup',
          translations: { 'pt-BR': 'Configuração do projeto' },
          items: [{ autogenerate: { directory: 'config' } }],
        },
        {
          label: 'Tooling',
          translations: { 'pt-BR': 'Ferramentas' },
          // Grouped by what the reader wants to do, URLs stay under /tooling/
          items: [
            {
              label: 'Command line and CI',
              translations: { 'pt-BR': 'Linha de comando e CI' },
              items: [
                { slug: 'tooling/cli' },
                { slug: 'tooling/docker' },
                { slug: 'tooling/github' },
                { slug: 'tooling/drawio' },
              ],
            },
            {
              label: 'Embed in your app',
              translations: { 'pt-BR': 'Incorporar na sua aplicação' },
              items: [
                { slug: 'tooling/embed' },
                { slug: 'tooling/vite-plugin' },
                { slug: 'tooling/react' },
                { slug: 'tooling/web-components' },
                { slug: 'tooling/app-config' },
                { slug: 'tooling/customization' },
              ],
            },
            {
              label: 'Work with the model in code',
              translations: { 'pt-BR': 'Trabalhar com o modelo no código' },
              items: [
                { slug: 'tooling/model-api' },
                { slug: 'tooling/model-api/reference' },
                { slug: 'tooling/model-api/builder' },
                { slug: 'tooling/model-api/edit' },
                { slug: 'tooling/code-generation/model' },
                { slug: 'tooling/code-generation/dsl' },
                { slug: 'tooling/code-generation/custom' },
              ],
            },
            { slug: 'tooling/ai-tools' },
            {
              label: 'Community',
              translations: { 'pt-BR': 'Comunidade' },
              collapsed: true,
              items: [{ autogenerate: { directory: 'tooling/Community' } }],
            },
          ],
        },
        {
          label: 'Guides',
          translations: { 'pt-BR': 'Guias' },
          items: [{ autogenerate: { directory: 'guides' } }],
        },
        {
          label: 'Showcases',
          translations: { 'pt-BR': 'Exemplos' },
          items: [{ autogenerate: { directory: 'showcases' } }],
        },
        {
          label: 'Changelog',
          translations: { 'pt-BR': 'Histórico de alterações' },
          items: [
            {
              label: 'Latest',
              translations: { 'pt-BR': 'Mais recente' },
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
              translations: { 'pt-BR': 'Versões' },
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
        PageFrame: './src/components/starlight/PageFrame.astro',
      },
    }),
    skills(),
  ],

  experimental: {
    contentIntellisense: true,
    chromeDevtoolsWorkspace: true,
  },

  vite: {
    resolve: {
      alias: {
        // 'likec4/vite-plugin/internal':
        //   new URL('../../packages/likec4/src/vite-plugin/internal.ts', import.meta.url).pathname,
        // 'likec4/model': new URL('../../packages/likec4/src/model/index.ts', import.meta.url).pathname,
        // Alias to bundled React components, can't use 'development' condition
        'likec4/react': new URL('../../packages/react/dist/index.mjs', import.meta.url).pathname,
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    plugins: [
      LikeC4VitePlugin({
        ai: 'disabled',
        workspace: 'src/components',
      }),
      tailwindcss(),
    ],
  },
})
