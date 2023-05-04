import { mergeConfig, defineProject, defineConfig } from 'vitest/config'
import configShared from '../../vitest.shared'

export default mergeConfig(
  configShared,
  defineProject({
    test: {
      name: 'generators'
    }
  })
)
