import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/index.ts',
      ],
      minify: {
        mangle: {
          keepNames: {
            class: true,
            function: true,
          },
        },
      },
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
