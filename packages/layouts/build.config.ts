import { defineBuildConfig } from 'unbuild'

// @ts-expect-error
const isProd = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/sequence/index.ts',
    './src/graphviz/binary/index.ts',
  ],
  clean: true,
  stub: false,
  declaration: isProd,
  failOnWarn: isProd,
  rollup: {
    esbuild: {
      platform: 'neutral',
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    output: {
      hoistTransitiveImports: false,
    },
    inlineDependencies: isProd,
    resolve: {
      exportConditions: ['sources', 'node'],
    },
  },
})
