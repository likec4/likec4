import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    build: {
      outDir: isWatchDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      sourcemap: isDev,
      chunkSizeWarningLimit: 800,
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
