import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        '@mantine/hooks',
        '@mantine/core'
      ],
      alias: {
        '@likec4/core': resolve(__dirname, '../core/src/index.ts'),
        '@likec4/diagram': resolve(__dirname, '../diagram/src/index.ts')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production')
    },
    esbuild: {
      // treeShaking: true,
      jsxInject: `import React from 'react'`
    },
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine()
        ]
      }
    },
    build: {
      outDir: isDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: !isDev,
      cssCodeSplit: false,
      // in bytes
      assetsInlineLimit: 1_000_000,
      /**
       * Adjust chunk size warning limit (in kB).
       */
      chunkSizeWarningLimit: 10_000,
      assetsDir: '',
      rollupOptions: {
        // treeshake: 'recommended',
        external: ['vscode'],
        output: {
          strict: true,
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`
        }
      },
      commonjsOptions: {
        // extensions: ['.js', '.cjs'],
        esmExternals: true
        //   requireReturnsDefault: true
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
