import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/node/index.ts',
        './src/browser/index.ts',
      ],
      rolldown: {
        platform: 'neutral',
        resolve: {
          mainFields: ['module', 'main'],
          conditionNames: ['sources', 'import', 'default'],
        },
      },
    },
  ],
}) as unknown
