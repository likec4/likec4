import { defineProject, defineConfig } from 'vitest/config'

export default defineProject({
  test: {
    name: 'likec4-cli',
    chaiConfig: {
      truncateThreshold: 300
    }
  }
})
