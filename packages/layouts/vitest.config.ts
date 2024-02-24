import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    root: __dirname,
    dir: 'src',
    name: 'layouts'
  }
})
