// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { viteAliases } from '#vite/aliases'
import { logger as consola } from '@likec4/log'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4ViteWebcomponentConfig } from './config-webcomponent.prod'
import { chunkSizeWarningLimit, viteLogger } from './utils'

const _dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(_dirname, '../..')

export function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
}: LikeC4ViteWebcomponentConfig): InlineConfig {
  const customLogger = viteLogger

  const root = resolve(pkgRoot, '__app__')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    resolve: {
      conditions: ['sources'],
      alias: viteAliases(),
    },
    clearScreen: false,
    base,
    publicDir: false,
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit,
      lib: {
        entry: 'src/webcomponent.js',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views',
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          format: 'iife',
          compact: true,
          hoistTransitiveImports: false,
          entryFileNames: filename,
        },
      },
    },
    plugins: [
      react({}),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        appConfig: {
          webcomponentPrefix,
        },
      }),
    ],
  }
}
