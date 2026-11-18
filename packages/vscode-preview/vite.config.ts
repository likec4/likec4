import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  const nodeEnv = isDev ? 'development' : 'production'
  process.env['NODE_ENV'] = 'production'
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
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    css: {
      postcss: {
        plugins: [
          postcssPanda() as any,
        ],
      },
    },
    oxc: {
      jsx: {
        development: false,
      },
    },
    tsconfig: 'tsconfig.src.json',
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
