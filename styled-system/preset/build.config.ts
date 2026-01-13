import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: 'node16',
  rollup: {
    esbuild: {
      minify: false,
      lineLimit: 500,
    },
    output: {
      exports: 'named',
    },
    inlineDependencies: true,
  },
})
