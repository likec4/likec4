import { defineProject, defineConfig } from 'vitest/config'

export default defineProject({
  test: {
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300
    }
  }
})
