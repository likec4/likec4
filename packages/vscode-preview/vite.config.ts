import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      conditions: ['development'],
      dedupe: ['react', 'react-dom'],
    },
    define: isDev ? {} : {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    esbuild: {
      jsxDev: false,
    },
    build: {
      outDir: isDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
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
