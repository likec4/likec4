import { mergeConfig, defineProject } from 'vitest/config'
import configShared from '../../vitest.shared'

export default mergeConfig(
  configShared,
  defineProject({
    resolve: {
      alias: {
        'vscode-uri': 'vscode-uri/lib/esm/index.js'
      }
    },
    test: {
      includeSource: ['src/__test__/**/*.ts'],
      name: 'language-server'
    }
  })
)
