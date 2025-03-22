import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: false,
  stub: false,
  declaration: 'node16',
  rollup: {
    inlineDependencies: true,
  },
  hooks: {
    async 'build:before'() {
      await import('./generate')
    },
  },
})
