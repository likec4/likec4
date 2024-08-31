import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'likec4',
    chaiConfig: {
      truncateThreshold: 300
    }
  }
})
