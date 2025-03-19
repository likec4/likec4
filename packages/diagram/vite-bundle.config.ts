import pandabox from '@pandabox/unplugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '\'production\'',
  },
  resolve: {
    conditions: ['production', 'sources'],
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
  },
  build: {
    outDir: 'bundle',
    emptyOutDir: true,
    cssCodeSplit: false,
    cssMinify: true,
    minify: true,
    target: 'esnext',
    lib: {
      entry: 'src/bundle/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      treeshake: {
        preset: 'safest',
      },
      output: {
        compact: true,
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
  plugins: [
    pandabox.vite({}),
    react(),
    dts({
      staticImport: true,
      rollupTypes: true,
      compilerOptions: {
        declarationMap: false,
      },
    }),
  ],
})
