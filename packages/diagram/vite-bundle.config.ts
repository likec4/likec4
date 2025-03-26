import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { rewriteRootSelector } from './vite.config'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      'react-dom/server': resolve('src/bundle/react-dom-server-mock.ts'),
    },
  },
  mode: 'production',
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
    minifyWhitespace: true,
    minifySyntax: true,
  },
  build: {
    outDir: 'bundle',
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: true,
    target: 'esnext',
    lib: {
      entry: 'src/bundle/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
      },
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        /@likec4\/core.*/,
        '@emotion/is-prop-valid', // dev-only import from framer-motion
      ],
    },
  },
  css: {
    postcss: {
      plugins: [
        pandacss(),
        rewriteRootSelector,
      ],
    },
  },
  plugins: [
    react(),
  ],
})
