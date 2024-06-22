import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'
import { searchForWorkspaceRoot } from 'vite'
import likec4grammar from './likec4.tmLanguage.json' assert { type: 'json' }
import structurizr from './structurizr.tmLanguage.json' assert { type: 'json' }

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    starlight({
      title: 'LikeC4',
      description: 'DSL and Toolchain for your architecture diagrams',
      social: {
        github: 'https://github.com/likec4/likec4'
      },
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        replacesTitle: true
      },
      editLink: {
        baseUrl: 'https://github.com/likec4/likec4/edit/main/apps/docs/'
      },
      customCss: [
        // Fontsource files for to regular and semi-bold font weights.
        '@fontsource/ibm-plex-sans/cyrillic-400.css',
        '@fontsource/ibm-plex-sans/cyrillic-500.css',
        '@fontsource/ibm-plex-sans/cyrillic-600.css',
        '@fontsource/ibm-plex-sans/cyrillic-ext-400.css',
        '@fontsource/ibm-plex-sans/cyrillic-ext-500.css',
        '@fontsource/ibm-plex-sans/cyrillic-ext-600.css',
        '@fontsource/ibm-plex-sans/latin-400.css',
        '@fontsource/ibm-plex-sans/latin-500.css',
        '@fontsource/ibm-plex-sans/latin-600.css',
        '@fontsource/ibm-plex-sans/latin-ext-400.css',
        '@fontsource/ibm-plex-sans/latin-ext-500.css',
        '@fontsource/ibm-plex-sans/latin-ext-600.css',
        './src/styles/global.css'
      ],
      sidebar: [
        {
          label: 'Getting started',
          items: [
            {
              label: 'Tutorial',
              link: '/tutorial'
            }
          ]
        },
        {
          label: 'LikeC4',
          autogenerate: { directory: 'dsl' }
        },
        {
          label: 'Examples',
          autogenerate: {
            directory: 'examples'
          }
        },
        {
          label: 'Tooling',
          autogenerate: { directory: 'tooling' }
        },
        {
          label: 'Guides',
          autogenerate: {
            directory: 'guides',
            collapsed: true
          }
        },
        {
          label: 'Changelog',
          link: 'https://github.com/likec4/likec4/releases',
          attrs: {
            target: '_blank',
            style: 'font-weight: 500; font-size: var(--sl-text-sm)',
            rel: 'noopener'
          }
        }
      ],
      expressiveCode: {
        plugins: [
          pluginLineNumbers(),
          pluginCollapsibleSections()
        ],
        styleOverrides: {
          borderRadius: '4px'
        },
        defaultProps: {
          // Disable line numbers by default
          showLineNumbers: false
        },
        shiki: {
          langs: [
            likec4grammar,
            structurizr
          ]
        }
      },
      pagination: false,
      credits: false,
      components: {
        SiteTitle: './src/components/starlight/SiteTitle.astro'
      },
      plugins: [
        starlightLinksValidator({
          exclude: [
            '/playground/blank/',
            '/playground/getting-started/',
            '/playground/'
          ]
        })
      ]
    })
  ],

  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname
      }
    },
    server: {
      fs: {
        // https://vitejs.dev/config/server-options.html#server-fs-allow
        allow: [searchForWorkspaceRoot(process.cwd())]
      }
    }
  }
})
