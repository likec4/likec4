import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { shadowStyle } from 'vite-plugin-shadow-style'

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vanillaExtractPlugin(),
      react(),
      dts()
    ],
    esbuild: {
      exclude: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'scheduler',
        '@mantine/core',
        '@mantine/hooks'
      ]
    },
    // optimizeDeps: {
    //   esbuildOptions: {
    //     plugins: [veEsbuild({runtime: false})]
    //   }
    // },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      outDir: 'dist',
      lib: {
        entry: [
          resolve(__dirname, 'src/index.ts'),
          resolve(__dirname, 'src/bundle.ts')
        ],
        // fileName: (format, entryName) => {
        //   return 'index.mjs'
        // },
        formats: ['es']
      },
      minify: 'terser',
      terserOptions: {
        ecma: 2020,
        keep_fnames: true
      },
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      target: 'esnext',
      commonjsOptions: {
        esmExternals: true,
        requireReturnsDefault: true
      },
      rollupOptions: {
        treeshake: 'smallest',
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'scheduler',
          '@mantine/core',
          '@mantine/hooks'
        ],
        plugins: [shadowStyle()]
      }
    }
  }
})
