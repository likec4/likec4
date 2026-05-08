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
    alias: {
      'react-dom/server': resolve('./src/react-dom-server-mock.ts'),
      '@likec4/styles': resolve('./styled-system/'),
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
    {
      buildStart() {
        this.info('pandacss')
        execSync('pnpm pandacss codegen', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
      },
    },
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
