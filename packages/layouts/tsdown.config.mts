import { defineConfig } from '@likec4/devops/tsdown'
import { execSync } from 'node:child_process'

export default defineConfig({
  entry: [
    'src/graphviz/ai/index.ts',
    'src/graphviz/binary/index.ts',
    'src/sequence/index.ts',
    'src/index.ts',
  ],
  platform: 'neutral',
  hooks: {
    'build:before': async () => {
      execSync('pnpm generate', {
        stdio: 'inherit',
      })
    },
  },
})
