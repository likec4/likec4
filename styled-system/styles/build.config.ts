import spawn from 'nano-spawn'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'preset.ts',
  ],
  outDir: 'dist',
  clean: false,
  stub: false,
  declaration: 'node16',
  failOnWarn: false,
  rollup: {
    inlineDependencies: true,
  },
  hooks: {
    async 'build:before'(ctx) {
      await spawn('pnpm', ['generate'])
    },
  },
})
