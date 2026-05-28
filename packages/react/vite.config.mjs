import postcssPanda from '@pandacss/dev/postcss'
import babel from '@rolldown/plugin-babel'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import process from 'node:process'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

const externals = Object
  .keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  })
  .filter((dep) => dep !== 'react' && dep !== 'react-dom')

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
    alias: [
      { find: /^@likec4\/styles\/(.+)$/, replacement: resolve('styled-system', '$1', 'index') },
    ],
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
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        keepNames: true,
        entryFileNames: '[name].mjs',
      },
      external: externals.map((dep) => new RegExp(`^${dep}(/.*)?$`)),
      plugins: [
        esmExternalRequirePlugin({
          external: [
            /^react(\/.*)?$/,
            /^react-dom(\/.*)?$/,
          ],
        }),
      ],
    },
  },
  plugins: [
    babel({
      presets: [reactCompilerPreset()],
    }),
    dts({
      bundleTypes: {
        bundledPackages: [
          '@likec4/diagram/custom',
          '@likec4/diagram',
          '@react-hookz/web',
          '@xstate/react',
          '@xstate/store',
          'xstate',
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
