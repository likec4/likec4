import { defineBuildConfig } from 'obuild/config'

// oxlint-disable-next-line no-default-export
export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        'src/graphviz/binary/index.ts',
        'src/sequence/index.ts',
        'src/index.ts',
      ],
      rolldown: {
        platform: 'neutral',
        resolve: {
          mainFields: ['module', 'main'],
          conditionNames: ['sources', 'import', 'default'],
        },
      },
      // dts: {
      //   build: true,
      //   resolver: 'tsc',
      // },
    },
  ],
}) as unknown
