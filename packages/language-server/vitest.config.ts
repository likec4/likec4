import { defineConfig, defineProject, mergeConfig } from 'vitest/config'

export default defineProject({
  test: {
    root: __dirname,
    dir: 'src',
    // dir
    name: 'language-server'
  }
})
