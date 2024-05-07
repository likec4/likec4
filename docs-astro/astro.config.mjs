import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import likec4grammar from './likec4.tmLanguage.json' assert { type: 'json' }

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: true
  },
  integrations: [
    starlight({
      title: 'LikeC4',
      social: {
        github: 'https://github.com/likec4/likec4'
      },
      logo: {
        src: './src/assets/logo.svg',
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
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', link: '/guides/example/' }
          ]
        },
        {
          label: 'LikeC4 Language',
          autogenerate: { directory: 'dsl' }
        },
        {
          label: 'Themes',
          link: 'https://likec4.dev/docs/themes/'
        },
        {
          label: 'Tooling',
          autogenerate: { directory: 'tools' }
        }
      ],
      expressiveCode: {
        shiki: {
          langs: [
            likec4grammar
          ]
        }
      }
    })
  ]
})
