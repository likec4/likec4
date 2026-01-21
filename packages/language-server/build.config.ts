import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

// @ts-expect-error
const isProd = process.env.NODE_ENV === 'production'

export default defineBuildConfig([{
  entries: [
    './src/index.ts',
    './src/likec4lib.ts',
    './src/protocol.ts',
    './src/browser-worker.ts',
    './src/browser.ts',
  ],
  clean: true,
  stub: false,
  alias: {
    'raw-body': resolve('./src/empty.ts'),
    'content-type': resolve('./src/empty.ts'),
  },
  failOnWarn: true,
  declaration: true,
  rollup: {
    esbuild: {
      platform: 'neutral',
      minify: false,
      lineLimit: 500,
    },
    inlineDependencies: isProd,
    resolve: {
      exportConditions: ['sources'],
    },
  },
}])
