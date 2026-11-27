import { defineVitest } from '@likec4/devops/vitest'

export default defineVitest('likec4', {
  test: {
    exclude: ['**/lib/**', '**/node_modules/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
