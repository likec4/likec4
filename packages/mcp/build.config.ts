import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: false,
  alias: {
    'raw-body': resolve('./src/empty.ts'),
    'content-type': resolve('./src/empty.ts'),
  },
  rollup: {
    esbuild: {
      minify: true,
    },
    emitCJS: false,
    inlineDependencies: true,
    resolve: {
      exportConditions: ['node'],
    },
  },
})
