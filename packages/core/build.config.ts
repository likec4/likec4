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
    'src/styles/index.ts',
    'src/types/index.ts',
    'src/types/_aux.ts',
    'src/types/scalar.ts',
    'src/types/expression-model.ts',
    'src/types/expression.ts',
    'src/types/fqnRef.ts',
    'src/utils/iterable/index.ts',
    'src/utils/index.ts',
  ],
  clean: true,
  stub: false,
  declaration: 'node16',
  alias: {
    'object-hash': 'object-hash/dist/object_hash.js',
  },
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    output: {
      hoistTransitiveImports: false,
    },
  },
})
