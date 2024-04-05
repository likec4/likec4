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
  return {
    plugins: [
      vanillaExtractPlugin(),
      react(),
      dts()
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
      lib: {
        entry: {
          // 'bundle': resolve(__dirname, 'src/bundle.ts'),
          'index': resolve(__dirname, 'src/index.ts')
        },
        formats: ['es', 'cjs']
      },
      minify: 'terser',
      terserOptions: {
        ecma: 2020,
        compress: true,
        keep_classnames: true,
        keep_fnames: true
      },
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: true,
      // commonjsOptions: {
      //   esmExternals: true,
      //   requireReturnsDefault: true
      // },
      rollupOptions: {
        external
        // plugins: [shadowStyle()]
      }
    }
  }
})
