import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/builder/index.ts',
    'src/compute-view/relationships-view/index.ts',
    'src/compute-view/index.ts',
    'src/model/connection/deployment/index.ts',
    'src/model/connection/model/index.ts',
    'src/model/connection/index.ts',
    'src/model/index.ts',
    'src/theme/index.ts',
    'src/types/index.ts',
    'src/types/aux.ts',
    'src/utils/iterable/index.ts',
    'src/utils/index.ts',
  ],
  clean: true,
  stub: false,
  declaration: 'node16',
  rollup: {
    inlineDependencies: true,
    resolve: {
      browser: true,
    },
  },
})
