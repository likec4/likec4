/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

const pattern = ['**/*.ts', '!**/*.spec.ts', '!__test__/']

// prettier-ignore
export default defineBuildConfig([{
  entries: [{
    builder: 'mkdist',
    input: 'src',
    format: 'esm',
    ext: 'js',
    pattern,
  },{
    builder: 'mkdist',
    input: 'src',
    format: 'cjs',
    ext: 'cjs' as any,
    pattern
  }],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: true,
  sourcemap: true,
  declaration: 'compatible',
}])
