import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['development'],
  },
  test: {
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300,
    },
    typecheck: {
      enabled: true,
    },
  },
})
