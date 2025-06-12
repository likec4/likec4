import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  stub: false,
  clean: true,
  declaration: 'node16',
  rollup: {
    esbuild: {
      minify: false,
      lineLimit: 500,
    },
    inlineDependencies: true,
    resolve: {
      exportConditions: ['sources'],
    },
  },
})
