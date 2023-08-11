/* eslint-disable */
import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
const mkdist = {
  builder: 'mkdist',
  input: './src/',
  pattern: [
    '**/*.(ts|tsx)',
    '!**/*.spec.*',
    '!**/diagram/icons/*',
  ]
} as const

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      ...mkdist,
      format: 'esm',
      ext: 'js',
      distDir: resolve(__dirname, 'dist'),
      declaration: true
    },{
      ...mkdist,
      format: 'cjs',
      ext: 'js',
      distDir: resolve(__dirname, 'dist/__cjs'),
      declaration: false
    }
  ],
  clean: true,
  rollup: {
    commonjs: {
      esmExternals: true
    },
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    esbuild: {
      platform: 'browser'
    }
  }
})
