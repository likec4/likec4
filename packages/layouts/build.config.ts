import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/sequence/index.ts',
    './src/graphviz/binary/index.ts',
  ],
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
