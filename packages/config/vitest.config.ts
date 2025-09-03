import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'config',
    chaiConfig: {
      truncateThreshold: 300,
    },
  },
})
