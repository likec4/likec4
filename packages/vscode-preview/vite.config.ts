import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      conditions: ['production', 'sources'],
      alias: {
        '@likec4/core/model': resolve(__dirname, '../core/src/model'),
        '@likec4/core/types': resolve(__dirname, '../core/src/types'),
        '@likec4/core': resolve(__dirname, '../core/src'),
        '@likec4/diagram': resolve(__dirname, '../diagram/src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    esbuild: {
      jsxDev: false,
    },
    build: {
      outDir: isDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
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
          preset: 'safest',
        },
        output: {
          hoistTransitiveImports: false,
          compact: true,
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
        external: [
          'vscode',
          '@emotion/is-prop-valid', // dev-only import from framer-motion
        ],
      },
    },
    plugins: [
      react(),
      vanillaExtractPlugin(
        isDev
          ? {
            unstable_mode: 'transform',
          }
          : {},
      ),
    ],
  }
})
