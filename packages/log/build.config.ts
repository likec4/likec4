import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      platform: 'neutral',
    },
    output: {
      hoistTransitiveImports: false,
    },
    inlineDependencies: true,
  },
})
