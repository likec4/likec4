import { resolve } from 'path'
import { defineConfig } from 'vite'
import watchAndRun from 'vite-plugin-watch-and-run'

export default defineConfig({
  resolve: {
    alias: {
      '@likec4/diagrams': resolve(__dirname, '../../packages/diagrams/src/index.ts'),
      '@likec4/core': resolve(__dirname, '../../packages/core/src/index.ts')
    }
  },
  plugins: [
    watchAndRun([
      {
        name: 'likec4',
        watch: resolve(__dirname, 'src/**/*.c4'),
        run: 'yarn run generate'
      }
    ])
  ]
})
