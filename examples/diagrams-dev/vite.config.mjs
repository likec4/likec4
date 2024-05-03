import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { watchAndRun } from 'vite-plugin-watch-and-run'

export default defineConfig({
  mode: 'development',
  resolve: {
    alias: {
      '@likec4/diagram': resolve(__dirname, '../../packages/diagram/src/index.ts'),
      '@likec4/diagrams': resolve(__dirname, '../../packages/diagrams/src/index.ts'),
      '@likec4/core': resolve(__dirname, '../../packages/core/src/index.ts')
    }
  },
  plugins: [
    react(),
    watchAndRun([
      {
        name: 'likec4',
        watch: resolve(__dirname, 'likec4/**/*.c4'),
        run: 'yarn run generate'
      }
    ])
  ]
})
