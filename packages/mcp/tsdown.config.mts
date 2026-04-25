import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
  ],
  inputOptions: {
    resolve: {
      conditionNames: ['production', 'sources', 'node', 'import', 'default'],
    },
  },
  dts: false,
})
