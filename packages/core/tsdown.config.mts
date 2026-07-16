import { codeSplittingGroup, defineConfig, outputOptions } from '@likec4/devops/tsdown'

export default defineConfig({
  entry: [
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
  platform: 'neutral',
  outputOptions: outputOptions({
    codeSplitting: {
      groups: [
        codeSplittingGroup(/node_modules\/mdast/, 'libs/mdast'),
        codeSplittingGroup(/node_modules\/remark/, 'libs/remark'),
      ],
    },
  }),
})
