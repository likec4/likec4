import { defineBuildConfig } from 'obuild/config'

// oxlint-disable-next-line no-default-export
export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        'src/index.ts',
        'src/sequence/index.ts',
        'src/graphviz/GraphvizLayoter.ts',
        'src/graphviz/QueueGraphvizLayoter.ts',
        'src/graphviz/wasm/index.ts',
        'src/graphviz/binary/index.ts',
      ],
      rolldown: {
        platform: 'neutral',
        resolve: {
          mainFields: ['module', 'main'],
        },
      },
      // dts: {
      //   build: true,
      //   resolver: 'tsc',
      // },
    },
  ],
}) as unknown
