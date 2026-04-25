// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { env, isDevelopment } from 'std-env'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { BuildEnvironmentOptions, InlineConfig, Logger } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import type { LikeC4 } from '../LikeC4'
import type { ViteLogger } from '../logger'
import { viteAliases } from './aliases'
import { relativeToCwd, viteAppRoot, viteLogger } from './utils'

export type LikeC4ViteConfig = {
  customLogger?: ViteLogger
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  title?: string | undefined
  theme?: 'light' | 'dark' | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
  likec4AssetsDir: string
  outputSingleFile?: boolean | undefined
}

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  const customLogger = cfg.customLogger ?? viteLogger
  const root = viteAppRoot()
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(relativeToCwd(root))}`)

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(relativeToCwd(outDir)))

  let base = '/'
  if (cfg.base) {
    base = withTrailingSlash(cfg.base)
    if (!hasProtocol(base) && base !== './') {
      base = withLeadingSlash(base)
    }
  }
  if (base !== '/') {
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }

  const webcomponentPrefix = cfg.webcomponentPrefix ?? 'likec4'
  const title = cfg.title ?? 'LikeC4'

  const isSingleFile = cfg.outputSingleFile ?? false

  return {
    isDev: isDevelopment,
    likec4AssetsDir,
    webcomponentPrefix,
    title,
    root,
    languageServices,
    clearScreen: false,
    base,
    resolve: {
      alias: {
        ...viteAliases(),
        'likec4/previews': likec4AssetsDir,
      },
    },
    configFile: false,
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      cssMinify: false,
      minify: true,
      copyPublicDir: true,
      ...(!isSingleFile && {
        rolldownOptions: {
          input: [
            resolve(root, 'index.html'),
            resolve(root, 'src', 'main.mjs'),
            resolve(root, 'src', 'fonts.css'),
            resolve(root, 'src', 'style.css'),
          ],
        },
      } satisfies BuildEnvironmentOptions),
    },
    customLogger: customLogger as Logger,
    plugins: [
      react(),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        appConfig: {
          webcomponentPrefix,
          pageTitle: title,
          useHashHistory: cfg.useHashHistory,
          theme: cfg.theme,
        },
      }),
      // Enable single file output
      isSingleFile ? viteSingleFile() : undefined,
    ],
  } satisfies InlineConfig & Omit<LikeC4ViteConfig, 'customLogger'> & { isDev: boolean }
}
