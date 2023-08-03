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
    test: {
      name: 'generators'
    }
  })
)
