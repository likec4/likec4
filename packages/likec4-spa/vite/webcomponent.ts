import type { LikeC4 } from '@likec4/language-services/node'
import type { InlineConfig, LogLevel } from 'vite'
import type { AppSource } from './app-source'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import k from 'tinyrainbow'
import { build, mergeConfig } from 'vite'
import { createViteLogger } from './logger'

export type BuildWebcomponentOptions = {
  app: AppSource
  likec4: LikeC4
  outDir: string
  base: string
  webcomponentPrefix?: string | undefined
  /**
   * Name of the output file
   * @default 'likec4-views.js'
   */
  filename?: string
  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined
  logLevel?: LogLevel | undefined
}

/**
 * Vite config of the web components (`likec4 gen webcomponent`), a single IIFE bundle
 */
export function webcomponentViteConfig({
  app,
  likec4,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
  customization,
  logLevel,
}: BuildWebcomponentOptions): InlineConfig {
  const customLogger = createViteLogger(['vite', 'webcomponent'])
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return mergeConfig(
    app.config,
    {
      root: app.root,
      clearScreen: false,
      base,
      configFile: false,
      publicDir: false,
      mode: 'production',
      ...(logLevel && { logLevel }),
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
          entry: app.entries.webcomponent,
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
          likec4,
          webcomponentPrefix,
          customization,
        }),
      ],
    } satisfies InlineConfig,
  ) as InlineConfig
}

/**
 * Builds the web components (`likec4 gen webcomponent`) into `outDir`
 */
export async function buildWebcomponent(options: BuildWebcomponentOptions): Promise<void> {
  await build(webcomponentViteConfig(options))
}
