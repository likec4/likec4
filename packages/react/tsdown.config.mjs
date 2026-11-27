import { execSync } from 'node:child_process'
import { join } from 'node:path'
import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
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
  entry: 'src/index.ts',
  platform: 'browser',
  inputOptions: {
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
  fixedExtension: true,
  outputOptions: {
    minify: {
      mangle: {
        keepNames: true,
      },
    },
    comments: {
      jsdoc: false,
      legal: false,
      annotation: true,
    },
  },
  dts: {
    generator: 'tsrs',
  },
  deps: {
    onlyBundle: false,
    neverBundle: [
      /^likec4(\/|$)/,
      'immer',
      'type-fest',
      /^react(\/|$)/,
      /^react-dom(\/|$)/,
    ],
  },
  plugins: [
    viteAliasPlugin({
      entries: [
        {
          find: /^@likec4\/core(\/.*)?$/,
          replacement: 'likec4/core$1',
        },
        {
          find: /^@likec4\/layouts(\/.*)?$/,
          replacement: 'likec4/layouts$1',
        },
        {
          find: /@likec4\/styles\/(.*)/,
          replacement: join(process.cwd(), 'styled-system', '$1', 'index.mjs'),
        },
      ],
    }),
    react({
      compiler: true,
      exclude: [/\.d\.[cm]?ts$/],
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
})
