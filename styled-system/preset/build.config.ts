import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/defaults/index.ts',
  ],
  clean: true,
  declaration: 'node16',
  rollup: {
    emitCJS: true,
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
