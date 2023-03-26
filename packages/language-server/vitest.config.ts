import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vscode-uri': 'vscode-uri/lib/esm/index.js'
    }
  },
  test: {
    globals: true,
    snapshotFormat: {
      escapeString: false
    }
  }
})
