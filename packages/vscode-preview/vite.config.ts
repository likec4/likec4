import pandaCss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      conditions: ['sources'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    esbuild: {
      jsx: 'automatic',
      jsxDev: false,
      tsconfigRaw: readFileSync('tsconfig.src.json', 'utf-8'),
    },
    css: {
      postcss: {
        plugins: [
          pandaCss(),
        ],
      },
    },
    build: {
      outDir: isDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssMinify: true,
      minify: !isDev,
      assetsInlineLimit: 1_000_000,
      chunkSizeWarningLimit: 10_000,
      assetsDir: '',
      modulePreload: false,
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.mjs', '.js'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove',
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          hoistTransitiveImports: false,
          compact: true,
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
        external: [
          'vscode',
          'react-dom/server',
          '@emotion/is-prop-valid', // dev-only import from motion
        ],
      },
    },
    plugins: [
      react(),
    ],
  }
})
