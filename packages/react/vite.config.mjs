import process from 'node:process'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    target: 'esnext',
    minify: true,
    sourcemap: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        // xyflow: 'src/xyflow.ts',
      },
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        entryFileNames: '[name].mjs',
      },
      external: [
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'react',
        'react-dom',
        '@emotion/is-prop-valid', // dev-only import from motion
        /@likec4\/core.*/,
      ],
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      bundledPackages: [
        '@likec4/diagram',
        '@likec4/diagram/custom',
        '@xstate/react',
        'xstate',
        '@react-hookz/web',
      ],

      afterRollup(result) {
        if (result.errorCount > 0) {
          console.error('Rollup failed')
          process.exit(1)
        }
      },
    }),
  ],
})
