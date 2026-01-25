import nodePolyfills from '@rolldown/plugin-node-polyfills'
import { defineBuildConfig } from 'obuild/config'

// oxlint-disable-next-line no-default-export
export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        'src/index.ts',
        'src/builder/index.ts',
        'src/compute-view/relationships-view/index.ts',
        'src/compute-view/index.ts',
        'src/geometry/index.ts',
        'src/model/connection/deployment/index.ts',
        'src/model/connection/model/index.ts',
        'src/model/connection/index.ts',
        'src/model/index.ts',
        'src/styles/index.ts',
        'src/types/index.ts',
        'src/types/_aux.ts',
        'src/types/scalar.ts',
        'src/types/RichText.ts',
        'src/types/expression-model.ts',
        'src/types/expression.ts',
        'src/types/fqnRef.ts',
        'src/utils/iterable/index.ts',
        'src/utils/graphology/index.ts',
        'src/utils/mnemonist.ts',
        'src/utils/index.ts',
      ],
      rolldown: {
        plugins: [nodePolyfills({})],
        platform: 'neutral',
        resolve: {
          mainFields: ['module', 'main'],
          alias: {
            'object-hash': 'object-hash/dist/object_hash.js',
          },
        },
      },
      dts: {
        // build: true,
        resolver: 'tsc',
      },
    },
  ],
  hooks: {
    rolldownConfig: (config) => {
      config.external = (config.external as string[]).filter((e) => e !== 'events' && e !== 'node:events')
    },
  },
}) as unknown
