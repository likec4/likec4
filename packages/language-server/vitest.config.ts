import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'language-server',
    setupFiles: [
      'src/test/setup.ts'
    ]
  }
})
