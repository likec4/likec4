import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { $ } from 'zx'

$.quiet = false
$.preferLocal = true
$.env = {
  ...$.env,
  NODE_ENV: 'production',
}

const stylesConfig = defineConfig({
  build: {
    outDir: 'dist/src',
    copyPublicDir: false,
    emptyOutDir: false,
    cssCodeSplit: true,
    cssMinify: true,
    lib: {
      entry: {
        'style.css': 'src/style.css',
        'fonts.css': 'src/fonts.css',
      },
      formats: ['es'],
    },
  },
})

export default defineConfig(({ mode, command }) => {
  if (mode === 'styles') {
    return stylesConfig
  }

  const isBuild = command === 'build'
  return {
    mode,
    resolve: {
      conditions: ['sources'],
      noExternal: [],
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'react-dom/server': resolve(import.meta.dirname, 'src/react-dom-server-mock.ts'),
        // Local paths for dev
        '@likec4/styles': resolve(import.meta.dirname, '../../styled-system/styles/dist'),
        'likec4/vite-plugin/internal': resolve(import.meta.dirname, '../vite-plugin/src/internal.ts'),
        ...(isBuild && {
          '@likec4/styles': resolve(import.meta.dirname, 'styled-system'),
        }),
      },
    },
    logLevel: 'info',
    plugins: [
      TanStackRouterVite(),
      react(),
    ],
  }
})
