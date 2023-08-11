import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import watchAndRun from 'vite-plugin-watch-and-run'

export default defineConfig(env => {
  return {
    plugins: [
      react(),
      watchAndRun([
        {
          name: 'likec4',
          watch: resolve(__dirname, 'src-dev/**/*.c4'),
          run: 'yarn run generate',
          delay: 300
        }
      ])
    ]
  }
})
