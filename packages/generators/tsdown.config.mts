import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/likec4/index.ts',
  ],
  platform: 'neutral',
})
