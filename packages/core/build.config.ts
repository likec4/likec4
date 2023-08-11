/* eslint-disable */
import { defineBuildConfig } from 'unbuild'

// prettier-ignore
export default defineBuildConfig([{
  entries: [
    'src/index.ts',
    'src/colors.ts',
    'src/types/index.ts',
    'src/compute-view/index.ts',
    'src/errors/index.ts',
    'src/utils/index.ts',
  ],
  clean: true,
  declaration: 'compatible',
  rollup: {
    emitCJS: true,
    output: {
      preserveModules: true
    },
    esbuild: {
      target: 'es2022'
    }
  },
}])
