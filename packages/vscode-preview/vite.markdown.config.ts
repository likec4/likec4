import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
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
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.MODE': JSON.stringify(nodeEnv),
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
      outDir: isWatchDev ? resolve('..', 'vscode', 'dist', 'markdown') : 'dist/markdown',
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      minify: !isDev,
      assetsInlineLimit: 10_000_000,
      chunkSizeWarningLimit: 20000,
      assetsDir: '',
      modulePreload: false,
      lib: {
        entry: resolve('src/markdown/index.ts'),
        name: 'LikeC4MarkdownPreview',
        formats: ['iife'],
        fileName: () => 'index.js',
      },
      rolldownOptions: {
        external: [
          'vscode',
          'react-dom/server',
          '@emotion/is-prop-valid',
        ],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    plugins: [
      react({
        compiler: true,
      }),
      {
        name: 'ensure-panda',
        buildApp: {
          order: 'pre',
          handler() {
            if (!isWatchDev && !existsSync(resolve('styled-system'))) {
              this.info('shipping panda')
              execSync('pandacss codegen --clean', {
                stdio: 'inherit',
                cwd: process.cwd(),
              })
            }
          },
        },
      },
      {
        name: 'copy-preview-css',
        closeBundle() {
          const targetDir = isWatchDev ? resolve('..', 'vscode', 'dist', 'markdown') : resolve('dist/markdown')
          mkdirSync(targetDir, { recursive: true })
          copyFileSync(resolve('src/markdown/preview.css'), resolve(targetDir, 'preview.css'))
        },
      },
    ],
  }
})
