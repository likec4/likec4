import spawn from 'nano-spawn'
import { resolve } from 'node:path'
import { type BuildEntry, defineBuildConfig } from 'unbuild'

const bundled: BuildEntry = {
  input: './src/bundled.ts',
  name: 'bundled',
  builder: 'rollup',
  declaration: false,
}

// @ts-expect-error
const isProd = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  entries: [bundled],
  clean: true,
  stub: false,
  alias: {
    'raw-body': resolve('./src/empty.ts'),
    'content-type': resolve('./src/empty.ts'),
  },
  failOnWarn: isProd,
  rollup: {
    esbuild: {
      minify: isProd,
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    inlineDependencies: isProd,
    resolve: {
      exportConditions: ['node', 'sources'],
    },
  },
  hooks: {
    'rollup:done': async () => {
      console.log('Building types...')
      await spawn('tsc', ['-p', 'tsconfig.build.json'], {
        stdout: 'inherit',
      })
    },
  },
})
