import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['tests/**'],
    typecheck: {
      enabled: true,
    },
  },
})
