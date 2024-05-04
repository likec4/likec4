import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' assert { type: 'json' }

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  /zustand.*/,
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom/client'
]

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [
      vanillaExtractPlugin({
        identifiers: isProd ? 'short' : 'debug'
      }),
      react({
        // jsxRuntime: 'classic'
      }),
      isProd && dts({
        compilerOptions: {
          rootDir: './src',
          declarationMap: false
        }
      })
    ],
    esbuild: {
      jsxDev: false,
      minifySyntax: true,
      minifyIdentifiers: false,
      minifyWhitespace: true
      // exclude: external,
      // jsxInject: `import React from 'react'`
    },
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    mode,
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    build: {
      outDir: 'dist',
      emptyOutDir: isProd,
      lib: {
        entry: {
          'index': resolve(__dirname, 'src/index.ts')
        },
        fileName(_format, entryName) {
          return `${entryName}.mjs`
        },
        formats: ['es']
      },
      cssCodeSplit: false,
      cssMinify: false,
      minify: 'esbuild',
      commonjsOptions: {
        // extensions: ['.js', '.cjs'],
        esmExternals: true
        //   requireReturnsDefault: true
      },
      rollupOptions: {
        output: {
          strict: true,
          minifyInternalExports: true,
          esModule: true,
          exports: 'named'
        },
        external
      }
    }
  }
})
