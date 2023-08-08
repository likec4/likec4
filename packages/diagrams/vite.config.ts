import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import watchAndRun from 'vite-plugin-watch-and-run'
import UnoCSS from 'unocss/vite'

const isExternal = (id: string) => !id.startsWith('.') && !path.isAbsolute(id)

export default defineConfig(env => {
  return {
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    build: {
      minify: false,
      emptyOutDir: true,
      lib: {
        entry: {
          index: path.resolve(__dirname, 'src/index.ts')
        },
        formats: ['es', 'cjs']
      },
      rollupOptions: {
        external: isExternal,
        output: {
          preserveModules: true
          // preserveModulesRoot: 'src',
        }
      }
    },
    plugins: [
      UnoCSS(),
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
