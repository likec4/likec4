import spawn from 'nano-spawn'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/node/index.ts',
  ],
  clean: true,
  stub: false,
  declaration: 'node16',

  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    output: {
      hoistTransitiveImports: false,
    },
  },

  hooks: {
    'build:done': async () => {
      await spawn('pnpm', ['generate:schema'])
    },
  },
})
