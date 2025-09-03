const config = {
  name: 'e2e',
  imageAliases: {
    // '@' intentionally left blank to enable the 'default' to be picked up  as ./images
    '@root': '../root-level-images',
    '@nested': '../root-level-images/nested-1/nested-2',
  },
}

export default config
