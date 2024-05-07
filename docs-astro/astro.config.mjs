import starlight from '@astrojs/starlight'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'
import likec4grammar from './likec4.tmLanguage.json' assert { type: 'json' }

// https://astro.build/config
export default defineConfig({
  // devToolbar: {
  //   enabled: true
  // },
  // server: {
  //   port: 4321,
  //   host: true
  // },
  integrations: [
    starlight({
      title: 'LikeC4',
      social: {
        github: 'https://github.com/likec4/likec4'
      },
      tagline: 'A language for expressing and visualizing software architecture',
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        replacesTitle: true
      },
      customCss: [
        // Fontsource files for to regular and semi-bold font weights.
        '@fontsource/ibm-plex-sans/400.css',
        '@fontsource/ibm-plex-sans/500.css',
        '@fontsource/ibm-plex-sans/600.css',
        './src/styles/global.css'
      ],
      sidebar: [
        {
          label: 'What is LikeC4',
          link: '/'
        },
        {
          label: 'Getting Started',
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
          label: 'Tooling',
          autogenerate: { directory: 'tooling' }
        },
        {
          label: 'Guides',
          autogenerate: {
            directory: 'guides',
            collapsed: true
          }
        }
      ],
      expressiveCode: {
        plugins: [
          pluginLineNumbers()
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
            likec4grammar
          ]
        }
      },
      plugins: [
        starlightLinksValidator()
      ]
    })
  ]
})
