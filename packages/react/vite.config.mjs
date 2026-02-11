import pandacss from '@likec4/styles/postcss'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const rewriteRootSelector = {
  postcssPlugin: 'postcss-rewrite-root',
  Once(css) {
    css.walkRules((rule) => {
      let updatedSelectors = []
      for (let val of rule.selectors) {
        if (val.trim() === ':root') {
          // console.log('rewriting :root', rule.selectors)
          updatedSelectors.push('.likec4-shadow-root')
          continue
        }
        if (val.trim() === 'body') {
          updatedSelectors.push('.likec4-shadow-root')
          continue
        }
      }
      if (updatedSelectors.length) {
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
    conditions: ['sources', 'production'],
    alias: {
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      // Strip out
      'react-dom/server': resolve('src/react-dom-server-mock.ts'),
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
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
    platform: 'browser',
  },
  build: {
    target: 'esnext',
    minify: true,
    sourcemap: false,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
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
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      bundledPackages: [
        '@likec4/diagram',
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
