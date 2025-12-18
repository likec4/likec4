import { defineProject } from 'vitest/config'

const isNotWin = process.platform !== 'win32'

export default defineProject({
  test: {
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300,
    },
    typecheck: {
      enabled: isNotWin, // skipping typecheck on windows
    },
  },
})
