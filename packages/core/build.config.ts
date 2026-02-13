import nodePolyfills from '@rolldown/plugin-node-polyfills'
import { defineBuildConfig } from 'obuild/config'

// oxlint-disable-next-line no-default-export
export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        'src/builder/index.ts',
        'src/compute-view/index.ts',
        'src/geometry/index.ts',
        'src/model/index.ts',
        'src/styles/index.ts',
        'src/types/index.ts',
        'src/utils/graphology/index.ts',
        'src/utils/index.ts',
        'src/index.ts',
      ],
      minify: {
        compress: {
          keepNames: {
            class: true,
            function: true,
          },
        },
      },
      rolldown: {
        plugins: [nodePolyfills({})],
        platform: 'neutral',
        transform: {
          target: 'es2024',
        },
        resolve: {
          mainFields: ['module', 'main'],
          conditionNames: ['sources', 'import', 'default'],
        },
      },
      dts: {
        // tsgo: true,
      },
    },
  ],
  hooks: {
    rolldownConfig: (config) => {
      config.external = (config.external as string[]).filter((e) => e !== 'events' && e !== 'node:events')
    },
  },
}) as unknown
