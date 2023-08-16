/* eslint-disable */
import { defineBuildConfig } from 'unbuild'
import type { MkdistOptions } from 'mkdist'

const opts = {
  pattern: ['**/*.ts', '!**/*.spec.ts', '!__test__/'],
  esbuild: {
    platform: 'neutral'
  }
} satisfies MkdistOptions

// prettier-ignore
export default defineBuildConfig([{
//   entries: [
//     'src/compute-view/index.ts',
//     'src/types/index.ts',
//   ],
//   clean: true,
//   failOnWarn: false,
//   sourcemap: true,
//   declaration: true,
//   rollup: {
//     emitCJS: true,
//   }
// },{
  entries: [
    'src/types/index.ts',
    'src/colors.ts',
    'src/errors/index.ts',
    'src/utils/index.ts',
    'src/compute-view/index.ts',
    'src/index.ts',
  ],
  clean: true,
  // failOnWarn: false,
  // sourcemap: true,
  declaration: 'node16',
  rollup: {
    emitCJS: true,
  },

  // entries: [{
  //   builder: 'mkdist',
  //   input: 'src',
  //   format: 'esm',
  //   ext: 'js',
  //   ...opts,
  // },{
  //   builder: 'mkdist',
  //   input: 'src',
  //   format: 'cjs',
  //   ext: 'cjs' as any,
  //   ...opts,
  // }],
  // if clean enabled, TS Language server in VSCode has to be restarted
  // clean: false,
  // sourcemap: true,
  // declaration: 'compatible',
}])
