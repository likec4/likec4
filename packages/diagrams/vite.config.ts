import react from '@vitejs/plugin-react'
import { resolve, isAbsolute } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import watchAndRun from 'vite-plugin-watch-and-run'

const isExternal = (id: string) => !id.startsWith('.') && !isAbsolute(id)

export default defineConfig(env => {
  return {
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime']
    },
    build: {
      minify: false,
      emptyOutDir: true,
      lib: {
        entry: {
          index: resolve(__dirname, 'src', 'index.ts')
        },
        formats: ['es']
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
      // UnoCSS(),
      react(),
      watchAndRun([
        {
          name: 'likec4',
          watch: 'src-dev/**/*.c4',
          run: 'yarn run generate',
          delay: 300
        }
      ]),
      dts({
        entryRoot: resolve(__dirname, 'src'),
        exclude: ['src-dev']
      })
    ]
  }
})
