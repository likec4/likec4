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
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  declaration: 'compatible'
}])
