// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4 } from '@likec4/language-services/node'
import type { LikeC4VitePluginOptions } from '@likec4/vite-plugin'
import type { InlineConfig, Logger } from 'vite'
import type { AppSource } from './app-source'
import type { ViteLogger } from './logger'
import { resolve } from 'node:path'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import { mergeConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { createViteLogger } from './logger'
import { relativeToCwd } from './utils'

/**
 * Options of the LikeC4 app, shared by the dev server, the preview and the build
 */
export type AppViteOptions = {
  /**
   * Where the app comes from
   */
  app: AppSource
  likec4: LikeC4
  customLogger?: ViteLogger | undefined
  outputDir?: string | undefined
  base?: string | undefined
  title?: string | undefined
  theme?: 'light' | 'dark' | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
  outputSingleFile?: boolean | undefined
  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined
  /**
   * Optional user-provided directory whose files are copied as-is into the
   * output (Vite publicDir). Useful for static assets like images referenced
   * from likec4 views via absolute URLs.
   */
  userPublicDir?: string | undefined
  /**
   * AI configuration of the Vite plugin
   * @default 'auto'
   */
  ai?: LikeC4VitePluginOptions['ai']
}

/**
 * Normalizes the base url of the app: with trailing slash, and leading slash unless it is a full url or `./`
 */
export function normalizeBase(value: string | undefined): string {
  if (!value) {
    return '/'
  }
  let base = withTrailingSlash(value)
  if (!hasProtocol(base) && base !== './') {
    base = withLeadingSlash(base)
  }
  return base
}

/**
 * Vite config of the LikeC4 app
 */
export function appViteConfig({ app, likec4, ...cfg }: AppViteOptions) {
  const customLogger = cfg.customLogger ?? createViteLogger('vite')
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(relativeToCwd(app.root))}`)

  const outDir = cfg.outputDir ?? resolve(likec4.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(relativeToCwd(outDir)))

  const base = normalizeBase(cfg.base)
  if (base !== '/') {
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }
  const webcomponentPrefix = cfg.webcomponentPrefix ?? 'likec4'
  const title = cfg.title ?? 'LikeC4'

  const isSingleFile = cfg.outputSingleFile ?? false

  const config = mergeConfig(
    app.config,
    {
      root: app.root,
      clearScreen: false,
      base,
      configFile: false,
      mode: 'production',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        minify: true,
        copyPublicDir: true,
        chunkSizeWarningLimit: 2 * 1024, // ~2MB
        ...(!isSingleFile && {
          rolldownOptions: {
            input: app.entries.app.map(entry => resolve(app.root, entry)),
            onLog(level, log, defaultHandler) {
              if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
                return // Ignore module level directive warnings
              }
              defaultHandler(level, log) // otherwise, just print the log
            },
          },
        }),
      },
      customLogger: customLogger as Logger,
      plugins: [
        LikeC4VitePlugin({
          likec4,
          ...(cfg.ai && { ai: cfg.ai }),
          webcomponentPrefix,
          title,
          useHashHistory: cfg.useHashHistory,
          theme: cfg.theme,
          customization: cfg.customization,
        }),
        ...app.plugins,
        // Enable single file output
        isSingleFile ? viteSingleFile() : undefined,
      ],
    } satisfies InlineConfig,
  ) as InlineConfig

  return {
    config,
    customLogger,
    base,
    outDir,
    webcomponentPrefix,
    title,
  }
}
