import { defineConfig } from '@likec4/devops/tsdown'

export default defineConfig({
  entry: [
    'src/node/index.ts',
    'src/browser/index.ts',
  ],
  unbundle: true,
  deps: {
    neverBundle: [
      /^vscode-/,
      /^node:/,
    ],
  },
})
