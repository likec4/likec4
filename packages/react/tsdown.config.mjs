import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { viteAliasPlugin } from 'rolldown/experimental'
import { defineConfig } from 'tsdown'

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
  entry: [
    'src/index.ts',
  ],
  platform: 'browser',
  inputOptions: {
    resolve: {
      mainFields: ['module', 'main'],
      conditionNames: ['sources', 'module', 'import', 'default'],
    },
    onLog(level, log, defaultHandler) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
        return // Ignore module level directive warnings
      }
      defaultHandler(level, log) // otherwise, just print the log
    },
  },
  minify: true,
  css: {
    minify: true,
    transformer: 'postcss',
    postcss: {
      plugins: [
        postcssPanda(),
        rewriteRootSelector,
      ],
    },
  },
  outputOptions: {
    exports: 'named',
    keepNames: true,
    entryFileNames: '[name].mjs',
  },
  dts: {
    build: true,
  },
  deps: {
    onlyBundle: false,
    neverBundle: [
      /^@likec4\/core/,
      'immer',
      'type-fest',
      /^react(\/|$)/,
      /^react-dom(\/|$)/,
    ],
    resolveDepSubpath: true,
  },
  plugins: [
    react({
      compiler: true,
      exclude: [/\.d\.[cm]?ts$/],
    }),
    viteAliasPlugin({
      entries: [
        {
          find: /@likec4\/styles\/(.*)/,
          replacement: join(process.cwd(), 'styled-system', '$1', 'index.mjs'),
        },
      ],
    }),
  ],
  hooks: {
    'build:before': async (ctx) => {
      const { logger } = ctx.options
      logger.info('shipping panda')
      execSync('pnpm pandacss codegen', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
    },
  },
  checks: {
    bundlerTimings: false,
  },
})
