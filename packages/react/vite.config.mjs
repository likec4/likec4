import postcssPanda from '@pandacss/dev/postcss'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { $ } from 'zx'
import packageJson from './package.json' with { type: 'json' }

$.quiet = false
$.verbose = true
$.preferLocal = true
$.env = {
  ...$.env,
  NODE_ENV: 'production',
}

const externals = Object
  .keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  })
  .filter((dep) => dep !== 'use-sync-external-store')

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
    tsconfigPaths: true,
    conditions: ['sources', 'module', 'import', 'default'],
    dedupe: [
      'react',
      'react-dom',
    ],
    alias: {
      'use-sync-external-store/shim/with-selector.js': 'use-sync-external-store/shim/with-selector',
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
    target: 'esnext',
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 1024 * 1024 * 2, // 2Mb
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        keepNames: true,
        entryFileNames: '[name].mjs',
      },
      treeshake: {
        moduleSideEffects: 'no-external',
      },
      external: [
        ...externals.map((dep) => new RegExp(`^${dep}(\\/.*)?$`)),
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
      ],
    },
  },
  plugins: [
    {
      name: 'likec4-react',
      async buildStart() {
        this.info('buildStart')
        await $`pandacss codegen`
      },
    },
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    dts({
      bundleTypes: {
        bundledPackages: [
          '@likec4/diagram',
          '@likec4/diagram/custom',
          '@likec4/styles/*',
          '@react-hookz/web',
          'xstate',
          '@xstate/*',
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
