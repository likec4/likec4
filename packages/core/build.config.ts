/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

const pattern = ['**/*.ts', '!**/*.spec.ts', '!__test__/']

// prettier-ignore
export default defineBuildConfig([{
  entries: [{
    builder: 'mkdist',
    input: 'src',
    format: 'esm',
    pattern
  },{
    builder: 'mkdist',
    input: 'src',
    format: 'cjs',
    pattern
  }],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  declaration: 'compatible',
}])
