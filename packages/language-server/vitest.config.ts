import { mergeConfig, defineConfig, defineProject } from 'vitest/config'

export default mergeConfig(
  defineConfig({
    test: {
      snapshotFormat: {
        escapeString: false
      }
    }
  }),
  defineProject({
    resolve: {
      alias: {
        'vscode-uri': 'vscode-uri/lib/esm/index.js'
      }
    },
    test: {
      name: 'language-server'
    }
  })
)
