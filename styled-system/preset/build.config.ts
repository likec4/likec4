import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/defaults/index.ts',
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false,
    esbuild: {
      platform: 'neutral',
      minify: false,
    },
    output: {
      exports: 'named',
    },
    inlineDependencies: true,
  },
})
