import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: false,
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
