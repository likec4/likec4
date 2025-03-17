import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: false,
  stub: false,
  declaration: 'node16',
  hooks: {
    async 'build:before'() {
      await import('./generate')
    },
  },
})
