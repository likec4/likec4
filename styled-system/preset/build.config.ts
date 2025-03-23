import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: false,
  stub: false,
  declaration: 'node16',
  rollup: {
    inlineDependencies: true,
    resolve: {
      exportConditions: ['sources'],
    },
  },
  hooks: {
    async 'build:before'() {
      await import('./generate')
    },
  },
})
