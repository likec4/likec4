import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: false,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
})
