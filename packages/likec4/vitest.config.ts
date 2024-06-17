import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    name: 'likec4',
    chaiConfig: {
      truncateThreshold: 300
    }
  }
})
