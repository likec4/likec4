import { createLikeC4Logger } from '@/logger'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import fs from 'node:fs'
import { resolve } from 'node:path'
import k from 'picocolors'
import postcssPresetMantine from 'postcss-preset-mantine'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'

export type LikeC4ViteConfig =
  | {
    languageServices: LanguageServices
    workspaceDir?: never
    outputDir?: string | undefined
    base?: string | undefined
  }
  | {
    languageServices?: never
    workspaceDir: string
    outputDir?: string | undefined
    base?: string | undefined
  }

export const viteConfig = async (cfg?: LikeC4ViteConfig) => {
  consola.warn('DEVELOPMENT MODE')
  const customLogger = createLikeC4Logger('c4:vite')

  const root = resolve('app')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  const outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  let base = '/'
  if (cfg?.base) {
    base = withTrailingSlash(cfg.base)
    if (!hasProtocol(base)) {
      base = withLeadingSlash(base)
    }
  }
  if (base !== '/') {
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }

  return {
    isDev: true,
    root,
    languageServices,
    configFile: false,
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts'),
        '@likec4/diagrams': resolve('../diagrams/src/index.ts')
      }
    },
    clearScreen: false,
    base,
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      copyPublicDir: true,
      // 500Kb
      assetsInlineLimit: 500 * 1024,
      chunkSizeWarningLimit: 3_000_000,
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      }
    },
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine()
        ]
      }
    },
    customLogger,
    plugins: [
      react(),
      likec4Plugin({ languageServices }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single'
      }),
      vanillaExtractPlugin({})
    ]
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
