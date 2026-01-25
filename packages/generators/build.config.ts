import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [{
    type: 'bundle',
    input: './src/index.ts',
    rolldown: {
      platform: 'neutral',
      resolve: {
        mainFields: ['module', 'main'],
        // conditionNames: ['sources', 'import', 'default'],
      },
    },
    // dts: {
    //   build: true,
    //   resolver: 'tsc',
    // },
  }],
})
