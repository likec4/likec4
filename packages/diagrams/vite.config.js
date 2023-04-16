import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    })
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: 'src/index.ts',
      fileName: ext => `index.${ext}.js`
    },
    target: 'esnext',
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies)
      ]
      // output: {
      //   // Provide global variables to use in the UMD build
      //   // for externalized deps
      //   globals: {
      //     vue: 'Vue',
      //   },
      // },
    }
  }
})
