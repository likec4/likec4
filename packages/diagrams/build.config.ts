/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
export default defineBuildConfig([{
  // entries: [{
  //   builder: 'mkdist',
  //   input: 'src',
  //   pattern: [
  //     '**/*',
  //     '!diagram/icons/*',
  //   ],
  //   esbuild: {
  //     jsx: "automatic",
  //     platform: 'browser',
  //     target: 'es2020'
  //   },
  //   ext: 'js',
  //   format: 'esm',
  // }],
  entries: [
    'src/index.ts',
    'src/browser/index.ts',
    'src/diagram/index.ts',
    'src/responsive/index.ts',
    'src/LikeC4.tsx',
  ],
  clean: true,
  declaration: 'compatible',
  rollup: {
    emitCJS: true,
    output: {
      preserveModules: true
    },
    esbuild: {
      jsx: "automatic",
      platform: 'browser',
      target: 'es2022'
    }
  },
}])
