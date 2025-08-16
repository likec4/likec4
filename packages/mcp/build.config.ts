import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: false,
  alias: {
    'raw-body': './src/empty.ts',
    'content-type': './src/empty.ts',
  },
  rollup: {
    esbuild: {
      minify: true,
    },
    emitCJS: false,
    inlineDependencies: true,
    resolve: {
      exportConditions: ['sources'],
    },
  },
})
