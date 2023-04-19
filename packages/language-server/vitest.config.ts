import { mergeConfig, defineProject } from 'vitest/config'
import configShared from '../../vitest.shared.mjs'

export default mergeConfig(
  configShared,
  defineProject({
    resolve: {
      alias: {
        'vscode-uri': 'vscode-uri/lib/esm/index.js'
      }
    },
    test: {
      includeSource: ['src/__test__/parser-smoke/*.ts'],
      name: 'language-server'
    }
  })
)
