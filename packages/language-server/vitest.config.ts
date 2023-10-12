import { mergeConfig, defineConfig, defineProject } from 'vitest/config'

export default mergeConfig(
  defineConfig({
    test: {
      snapshotFormat: {
        escapeString: false
      }
    }
  }),
  // @ts-ignore
  defineProject({
    test: {
      name: 'language-server'
    }
  })
)
