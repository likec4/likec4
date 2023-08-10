/* eslint-disable */
import { resolve } from 'path'
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
const mkdist = {
  builder: 'mkdist',
  input: './src/',
  pattern: [
    '**/*.ts',
    '!**/*.spec.*',
    '!**/__test__',
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
    }
  }
})
