import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import watchAndRun from 'vite-plugin-watch-and-run'

export default defineConfig(env => {
  return {
    plugins: [
      react(),
      watchAndRun([
        {
          name: 'likec4',
          watch: path.resolve('src-dev/**/*.c4'),
          run: 'yarn run generate',
          delay: 300
        }
      ])
    ]
  }
})
