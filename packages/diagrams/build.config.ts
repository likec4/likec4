/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
export default defineBuildConfig([{
  entries: [{
    builder: 'mkdist',
    input: 'src',
    pattern: [
      '**/*',
      '!diagram/icons/*',
    ],
    esbuild: {
      jsx: "automatic",
      platform: 'browser'
    },
    format: 'esm',
  },{
    builder: 'mkdist',
    input: 'src',
    pattern: [
      '**/*',
      '!diagram/icons/*',
    ],
    esbuild: {
      jsx: "automatic",
      platform: "browser"
    },
    format: 'cjs',
  }],
  // entries: [
  //   'src/index.ts'
  // ],
  clean: true,
  declaration: 'compatible',
  // rollup: {
  //   emitCJS: true,
  //   output: {
  //     preserveModules: true
  //   },
  //   esbuild: {
  //     jsx: "automatic",
  //     platform: 'browser',
  //     target: 'es2022'
  //   }
  // },
}])
