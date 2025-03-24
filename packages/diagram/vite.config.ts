import pandacss from '@likec4/styles/postcss'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    conditions: ['sources'],
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  css: {
    postcss: {
      plugins: [
        pandacss(),
      ],
    },
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: true,
    minify: false,
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName(_format, entryName) {
        return `${entryName}.js`
      },
    },
    rollupOptions: {
      input: [
        'src/index.ts',
        'src/bundle/index.ts',
        'src/styles.css',
      ],
      experimentalLogSideEffects: true,
      external: [
        ...Object.keys(packageJson.dependencies || {}),
        /framer-motion/,
        /motion-dom/,
        /motion-utils/,
        /@likec4\/styles/,
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'react-dom/server',
      ],
      treeshake: {
        preset: 'recommended',
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  plugins: [
    react(),
    dts({
      staticImport: true,
      tsconfigPath: 'tsconfig.src.json',
      insertTypesEntry: true,
      compilerOptions: {
        customConditions: [],
        noCheck: true,
        declarationMap: false,
        noImplicitAny: false,
        noImplicitOverride: false,
        noPropertyAccessFromIndexSignature: false,
      },
    }),
  ],
})
