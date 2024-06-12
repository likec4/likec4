/* eslint-disable */
import type { MkdistOptions } from 'mkdist'
import { defineBuildConfig } from 'unbuild'

const opts = {
  pattern: ['**/*.{ts,tsx}', '!stories/**'],
  esbuild: {
    jsx: 'automatic',
    platform: 'browser'
  }
} satisfies MkdistOptions

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: './src/',
      outDir: './dist/',
      format: 'esm',
      ext: 'js',
      ...opts
    }
  ],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false
})
