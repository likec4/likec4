import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'layouts',
    onConsoleLog: () => false
  }
})
