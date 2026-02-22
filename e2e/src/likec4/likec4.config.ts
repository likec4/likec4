import { defineConfig } from 'likec4/config'

export default defineConfig({
  name: 'e2e',
  implicitViews: false,
  imageAliases: {
    // '@' intentionally left blank to enable the 'default' to be picked up  as ./images
    '@root': '../root-level-images',
    '@nested': '../root-level-images/nested-1/nested-2',
  },
})
