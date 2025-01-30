import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'src/**.spec.ts',
      'src/**.test-d.ts',
    ],
    typecheck: {
      enabled: true,
    },
  },
})
