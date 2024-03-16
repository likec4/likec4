import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    plugins: [
      react(),
      vanillaExtractPlugin()
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@likec4/core': resolve(__dirname, '../core/src/index.ts'),
        '@likec4/diagram': resolve(__dirname, '../diagram/src/index.ts')
      }
    },
    build: {
      outDir: isWatchDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      sourcemap: isDev,
      minify: !isDev,
      chunkSizeWarningLimit: 1000,
      assetsDir: '',
      rollupOptions: {
        external: ['vscode'],
        output: {
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`
        }
      }
    }
  }
})
