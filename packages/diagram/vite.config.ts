import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' assert { type: 'json' }

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  'react/jsx-runtime',
  'react-dom/client'
]

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [
      vanillaExtractPlugin(),
      react(),
      isProd && dts({
        compilerOptions: {
          rootDir: './src',
          declarationMap: false
        }
      })
    ],
    esbuild: {
      exclude: external
    },
    // esbuild: {
    //   jsxDev: false
    // }
    // esbuild: {
    //   exclude: [
    //     'react',
    //     'react-dom',
    //     'react/jsx-runtime',
    //     'scheduler',
    //     '@mantine/core',
    //     '@mantine/hooks'
    //   ]
    // },
    // optimizeDeps: {
    //   esbuildOptions: {
    //     plugins: [veEsbuild({runtime: false})]
    //   }
    // },
    build: {
      outDir: 'dist',
      emptyOutDir: isProd,
      lib: {
        entry: {
          // 'bundle': resolve(__dirname, 'src/bundle.ts'),
          'index': resolve(__dirname, 'src/index.ts')
        },
        fileName(format, entryName) {
          return `${entryName}.mjs`
        },
        formats: ['es']
      },

      cssCodeSplit: false,
      cssMinify: true,
      minify: false,
      commonjsOptions: {
        // extensions: ['.js', '.cjs'],
        esmExternals: true
        //   requireReturnsDefault: true
      },
      rollupOptions: {
        external
      }
    }
  }
})
