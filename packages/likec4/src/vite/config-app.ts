// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { viteAliases } from '#vite/aliases'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig, Logger } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { logger } from '../logger'
import type { LikeC4ViteConfig } from './config-app.prod'
import { chunkSizeWarningLimit, viteLogger } from './utils'

export type { LikeC4ViteConfig }

const _dirname = dirname(fileURLToPath(import.meta.url))
export const pkgRoot = resolve(_dirname, '../..')

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  logger.warn(k.bold(k.yellow('DEVELOPMENT MODE')))
  const customLogger = cfg.customLogger ?? viteLogger

  const root = resolve(pkgRoot, '__app__')
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does111 not exist: ${root}`)
    throw new Error(`app root rrrdoes not exist: ${root}`)
  }

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  let base = '/'
  if (cfg.base) {
    base = withTrailingSlash(cfg.base)
    if (!hasProtocol(base)) {
      base = withLeadingSlash(base)
    }
  }
  if (base !== '/') {
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }

  const webcomponentPrefix = cfg.webcomponentPrefix ?? 'likec4'
  const title = cfg.title ?? 'LikeC4'

  return {
    isDev: true,
    likec4AssetsDir,
    webcomponentPrefix,
    title,
    root,
    languageServices,
    configFile: false,
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    resolve: {
      // conditions: ['development', 'sources'],
      external: [
        '@emotion/is-prop-valid',
      ],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      alias: {
        ...viteAliases(),
        'react-dom/server': resolve(root, 'src/react-dom-server-mock.js'),
      },
    },
    clearScreen: false,
    optimizeDeps: {
      force: true,
      exclude: [
        '@emotion/is-prop-valid',
      ],
    },
    base,
    build: {
      outDir,
      emptyOutDir: false,
      // cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      copyPublicDir: true,
      assetsInlineLimit: (path, content) => !path.endsWith('.png') && content.length < 1_000_000,
      chunkSizeWarningLimit,
      // commonjsOptions: {
      //       defaultIsModuleExports: (id: string) => {
      //     if (id.includes('react')) {
      //       return true
      //     }
      //     return 'auto'
      //   },
      //   requireReturnsDefault: 'auto',
      //   extensions: ['.js', '.mjs'],
      //   transformMixedEsModules: true,
      //   // requireReturnsDefault: 'namespace',
      //   ignoreTryCatch: 'remove'
      // // },
      // commonjsOptions: {
      //   requireReturnsDefault: 'auto',
      //   extensions: ['.js', '.mjs'],
      //   transformMixedEsModules: true,
      // //   // requireReturnsDefault: 'namespace',
      //   ignoreTryCatch: 'remove'
      // },
      rollupOptions: {
        input: [
          'index.html',
          'src/main.mjs',
          'src/style.css',
          'src/fonts.css',
        ],
        // output: {
        //   manualChunks: {
        //     'core': [
        //       '@likec4/core/geometry',
        //       '@likec4/core/styles',
        //       '@likec4/core/model',
        //       '@likec4/core/utils',
        //       '@likec4/core',
        //     ],
        //     // 'app': ['__app__/src'],
        //   },
        // },
        external: [
          '@emotion/is-prop-valid',
          'react-dom/server',
        ],
      },
      //   output: {
      //     interop: 'auto',
      //     hoistTransitiveImports: false,
      //   }
      // }
    },
    customLogger: customLogger as Logger,
    plugins: [
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        appConfig: {
          webcomponentPrefix,
          pageTitle: title,
          useHashHistory: cfg.useHashHistory,
          theme: cfg.theme,
        },
      }),
      // TanStackRouterVite({
      //   routeFileIgnorePattern: '.css.ts',
      //   generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
      //   routesDirectory: resolve(root, 'src/routes'),
      //   quoteStyle: 'single',
      // }),
      react(),
      cfg.outputSingleFile ? viteSingleFile() : undefined,
    ],
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
