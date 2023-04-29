import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import packageJson from './package.json'

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    vanillaExtractPlugin()
  ],
  resolve: {
    alias: {
      'animated-konva': resolve('src', 'animated-konva'),
    },
    dedupe: ['react', 'react-dom', 'scheduler']
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs']
    },
    target: 'esnext',
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {})
      ]
    }
  }
})
