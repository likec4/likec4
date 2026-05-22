import postcssPanda from '@pandacss/dev/postcss'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * @type {import('postcss').AcceptedPlugin}
 */
const rewriteRootSelector = {
  postcssPlugin: 'postcss-rewrite-root',
  Once(css) {
    css.walkRules((rule) => {
      let updated = false
      let updatedSelectors = []
      for (let val of rule.selectors) {
        let _val = val.trim()
        if (_val === ':root' || _val === 'body') {
          updatedSelectors.push('.likec4-shadow-root')
          updated = true
          continue
        }
        updatedSelectors.push(val)
      }

      if (updated) {
        rule.selectors = updatedSelectors
      }
    })
  },
}

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    conditions: ['sources'],
    tsconfigPaths: true,
    alias: {
      '@likec4/styles': resolve('./styled-system'),
    },
  },
  css: {
    postcss: {
      plugins: [
        postcssPanda(),
        rewriteRootSelector,
      ],
    },
  },
  build: {
    minify: true,
    sourcemap: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        keepNames: true,
        entryFileNames: '[name].mjs',
      },
      external: [
        /@likec4\/core.*/,
      ],
      plugins: [
        esmExternalRequirePlugin({
          external: [
            'react',
            'react-dom',
          ],
        }),
      ],
    },
  },
  plugins: [
    dts({
      copyDtsFiles: true,
      bundleTypes: {
        bundledPackages: [
          '@likec4/diagram',
          '@likec4/diagram/custom',
          '@react-hookz/web',
          'xstate',
          '@xstate/react',
          '@xstate/store',
        ],
      },

      afterRollup(result) {
        if (result.errorCount > 0) {
          console.error('Rollup failed')
          process.exit(1)
        }
      },
    }),
  ],
})
