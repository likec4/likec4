import { OGImageRoute } from 'astro-og-canvas'
import { getCollection } from 'astro:content'

const collectionEntries = await getCollection('docs')

/** Paths for all of our Markdown content we want to generate OG images for. */
const pages = process.env.SKIP_OG
  ? []
  : Object.fromEntries(collectionEntries.map(({ slug, data }) => [slug, data]))

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'path',

  pages,

  getImageOptions: (_, page) => {
    return {
      title: page.title,
      description: page.description,
      logo: {
        path: './public/img/og-logo.png',
      },
      bgImage: {
        path: './src/assets/og-bg.png',
        fit: 'cover'
      },
      font: {
        title: {
          size: 72,
          lineHeight: 1.25,
          families: [
            'IBM Plex Sans'
          ],
          weight: 'Medium',
          color: [255, 255, 255]
        },
        description: {
          size: 42,
          lineHeight: 1.3,
          families: [
            'IBM Plex Sans'
          ],
          weight: 'Normal',
          color: [255, 255, 255]
        }
      },
      fonts: [
        './src/pages/og/_fonts/ibm-plex-sans-medium.ttf',
        './src/pages/og/_fonts/ibm-plex-sans-regular.ttf'
      ]
    }
  }
})
