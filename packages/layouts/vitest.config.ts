import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    snapshotFormat: {
      escapeString: false
    }
  }
})
