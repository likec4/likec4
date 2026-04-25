import babel from '@rolldown/plugin-babel'
import react from '@vitejs/plugin-react'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isWatchDev = mode === 'watch-dev'
  const isDev = isWatchDev || mode === 'development'
  return {
    resolve: {
      conditions: ['sources'],
      // Prefer .ts/.tsx over .js so diagram src is used (avoid CJS .js in diagram/src)
      extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
      alias: {
        '@likec4/styles': resolve('styled-system'),
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    esbuild: {
      jsx: 'automatic',
      jsxDev: false,
      tsconfigRaw: readFileSync('tsconfig.src.json', 'utf-8'),
    },
    build: {
      outDir: isDev ? resolve(__dirname, '..', 'vscode', 'dist', 'preview') : 'dist',
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
          './index.html',
          './src/fonts.css',
          './src/index.css',
        ],
        output: {
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[extname]`,
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
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
  }
})
