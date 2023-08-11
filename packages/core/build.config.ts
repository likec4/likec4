/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
export default defineBuildConfig([{
  entries: [{
    builder: 'mkdist',
    input: 'src',
    format: 'esm',
    pattern: [
      '**/*.ts',
      '!**/*.spec.ts',
      '!__test__/',
    ]
  },{
    builder: 'mkdist',
    input: 'src',
    format: 'cjs',
    pattern: [
      '**/*.ts',
      '!**/*.spec.ts',
      '!__test__/',
    ]
  }],
  // clean: true,
  declaration: 'compatible',
  // rollup: {
  //   emitCJS: true,
  //   output: {
  //     preserveModules: true
  //   },
  //   esbuild: {
  //     target: 'es2022'
  //   }
  // },
}])
