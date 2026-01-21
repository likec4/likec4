import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    esbuild: {
      platform: 'neutral',
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    inlineDependencies: true,
    resolve: {
      exportConditions: ['sources', 'node'],
    },
  },
})
