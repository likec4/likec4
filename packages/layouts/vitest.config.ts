import { mergeConfig, defineProject, defineConfig } from 'vitest/config'
import configShared from '../../vitest.shared.mjs'

export default mergeConfig(
  configShared,
  defineProject({
    test: {
      name: 'layouts'
    }
  })
)
