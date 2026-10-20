import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  // React Compiler reads Vite's isProduction, which is derived from NODE_ENV.
  process.env['NODE_ENV'] = isDev ? 'development' : 'production'
  return {
    resolve: {
      conditionNames: ['sources', 'module', 'import', 'default'],
      alias: {
        '@likec4/diagram': resolve('..', 'diagram', 'src'),
        '@likec4/styles': resolve('styled-system'),
      },
    },
    mode: isDev ? 'development' : 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    css: {
      transformer: 'postcss',
      postcss: {
        plugins: [
          postcssPanda() as any,
        ],
      },
    },
    build: {
      outDir: isDev ? resolve('..', 'vscode', 'dist', 'preview') : 'dist',
      emptyOutDir: true,
      cssCodeSplit: true,
      cssMinify: true,
      minify: !isDev,
      assetsInlineLimit: 10_000_000,
      chunkSizeWarningLimit: 20000,
      assetsDir: '',
      modulePreload: false,
      rolldownOptions: {
        tsconfig: 'tsconfig.src.json',
        input: [
          'index.html',
          'src/fonts.css',
          'src/index.css',
        ],
        output: {
          entryFileNames: `[name].js`,
          assetFileNames: `[name][extname]`,
        },
        external: [
          'vscode',
          'react-dom/server',
          '@emotion/is-prop-valid', // dev-only import from motion
        ],
      },
    },
    plugins: [
      react({
        compiler: true,
      }),
      {
        name: 'ship-panda',
        buildApp: {
          order: 'pre',
          handler() {
            this.info('shipping panda')
            execSync('pandacss codegen --clean', {
              stdio: 'inherit',
              cwd: process.cwd(),
            })
          },
        },
      },
    ],
  }
})
