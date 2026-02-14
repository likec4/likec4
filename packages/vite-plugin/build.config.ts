import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/index.ts',
        './src/internal.ts',
      ],
      rolldown: {
        platform: 'node',
        resolve: {
          mainFields: ['module', 'main'],
          conditionNames: ['sources', 'import', 'default'],
        },
      },
    },
  ],
}) as unknown
