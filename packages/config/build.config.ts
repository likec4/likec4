import spawn from 'nano-spawn'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([{
  entries: [
    './src/index.ts',
    './src/node/index.ts',
  ],
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      platform: 'neutral',
      minifyIdentifiers: false,
    },
    output: {
      hoistTransitiveImports: false,
    },
  },
  hooks: {
    'build:done': async () => {
      await spawn('tsx', ['scripts/generate.mts'])
    },
  },
}])
