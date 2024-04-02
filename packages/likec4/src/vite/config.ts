import { createLikeC4Logger } from '@/logger'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import postcssPresetMantine from 'postcss-preset-mantine'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'

//
const _dirname = dirname(fileURLToPath(import.meta.url))

const getAppRoot = (): [path: string, isDev: boolean] => {
  /* @see packages/likec4/app/tsconfig.json */
  const root = resolve(_dirname, '../__app__')
  if (fs.existsSync(root)) {
    // we are bundled
    return [root, false]
  }
  // we are in dev
  return [resolve(_dirname, '../../app'), true]
}

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

  const [root, isDev] = getAppRoot()
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  if (!isDev) {
    consola.error(`app root not dev ${root}`)
    throw new Error(`app root not dev ${root}`)
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
    isDev,
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
      cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      // 100Kb
      assetsInlineLimit: 100 * 1024,
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
