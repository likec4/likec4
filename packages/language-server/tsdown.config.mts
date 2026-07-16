import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig({
  entry: [
    'src/filesystem/index.ts',
    'src/browser/index.ts',
    'src/browser/worker.ts',
    'src/icons.ts',
    'src/module.ts',
    'src/protocol.ts',
    'src/likec4lib.ts',
    'src/index.ts',
  ],
  platform: 'neutral',
  minify: false,
})
