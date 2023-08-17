/* eslint-disable */
import { defineBuildConfig } from 'unbuild'
import type { MkdistOptions } from 'mkdist'

const opts = {
  pattern: ['**/*', '!diagram/icons/*'],
  esbuild: {
    jsx: 'automatic',
    platform: 'browser'
  }
} satisfies MkdistOptions

// prettier-ignore
export default defineBuildConfig([{
  entries: [{
    builder: 'mkdist',
    input: 'src',
    ...opts,
    format: 'esm',
    ext: 'js',
  },{
    builder: 'mkdist',
    input: 'src',
    ...opts,
    format: 'cjs',
    ext: 'cjs' as any,
  }],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  sourcemap: true,
  declaration: 'compatible'
}])
