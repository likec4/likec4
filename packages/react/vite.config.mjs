import { resolve } from 'node:path'
import process from 'node:process'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    alias: {
      'react-dom/server': resolve('./src/react-dom-server-mock.ts'),
    },
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
        'react/jsx-dev-runtime',
        'immer',
        '@emotion/is-prop-valid', // dev-only import from motion
        /@likec4\/core.*/,
      ],
      plugins: [
        esmExternalRequirePlugin({
          external: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-dom/client',
          ],
        }),
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
