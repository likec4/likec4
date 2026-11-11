import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin'
import { reactDedupe, viteAliases } from './aliases'
import { viteAppRoot } from './utils'

export type LikeC4ViteWebcomponentConfig = {
  webcomponentPrefix: string | undefined
  languageServices: LikeC4
  outDir: string
  base: string
  filename?: string
  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined
}

export function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
  customization,
}: LikeC4ViteWebcomponentConfig): InlineConfig {
  const customLogger = createLikeC4Logger(['vite', 'webcomponent'])
  const root = viteAppRoot()
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    root,
    clearScreen: false,
    base,
    configFile: false,
    publicDir: false,
    mode: 'production',
    resolve: {
      alias: viteAliases(),
      dedupe: reactDedupe,
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      assetsInlineLimit: 500 * 1024, // 500KB
      chunkSizeWarningLimit: 3 * 1024, // ~3MB
      lib: {
        entry: 'codegen/webcomponent.mjs',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views',
      },
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
            return // Ignore module level directive warnings
          }
          defaultHandler(level, log) // otherwise, just print the log
        },
      },
    },
    customLogger,
    plugins: [
      LikeC4VitePlugin({
        ai: 'disabled',
        languageServices: languageServices.languageServices,
        webcomponentPrefix,
        customization,
      }),
    ],
  } satisfies InlineConfig
}
