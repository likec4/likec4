import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [{
    type: 'bundle',
    input: './src/index.ts',
    minify: true,
    rolldown: {
      platform: 'node',
      resolve: {
        mainFields: ['module', 'main'],
        conditionNames: ['production', 'sources', 'node', 'import', 'default'],
      },
    },
    dts: false,
  }],
}) as unknown
