import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin()
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        browser: 'src/browser/index.ts',
        embedded: 'src/embedded/index.ts'
      },
      // entry: 'src/index.ts',
      formats: ['es', 'cjs']
    },
    target: 'esnext',
    rollupOptions: {
      treeshake: true,
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies)
      ]
    }
  }
})
