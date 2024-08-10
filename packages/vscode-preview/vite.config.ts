import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      alias: {
        '@likec4/core': resolve(__dirname, '../core/src/index.ts'),
        '@likec4/diagram': resolve(__dirname, '../diagram/src/index.ts')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production')
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
        ignoreTryCatch: 'remove'
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended'
        },
        external: ['vscode'],
        output: {
          hoistTransitiveImports: false,
          compact: true,
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`
        }
      }
    },
    plugins: [
      react(),
      vanillaExtractPlugin(
        isDev
          ? {
            unstable_mode: 'transform'
          }
          : {}
      )
    ]
  }
})
