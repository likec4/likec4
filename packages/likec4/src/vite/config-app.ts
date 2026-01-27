import { viteAliases } from '@/vite/aliases'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { logger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin/plugin'
import type { LikeC4ViteConfig } from './config-app.prod'
import { chunkSizeWarningLimit, viteLogger } from './utils'

export type { LikeC4ViteConfig }

const _dirname = dirname(fileURLToPath(import.meta.url))
export const pkgRoot = resolve(_dirname, '../..')

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  logger.warn(k.bold(k.yellow('DEVELOPMENT MODE')))
  const customLogger = cfg.customLogger ?? viteLogger

  const root = resolve(pkgRoot, 'app')
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
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
    mode: 'development',
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      PAGE_TITLE: JSON.stringify(title),
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"development"',
    },
    resolve: {
      conditions: ['development', 'sources'],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      alias: {
        ...viteAliases(),
        'react-dom/server': resolve(pkgRoot, 'app/react/react-dom-server-mock.ts'),
      },
    },
    clearScreen: false,
    optimizeDeps: {
      force: true,
    },
    base,
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: false,
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
      // rollupOptions: {
      //   treeshake: {
      //     preset: 'safest'
      //   },
      //   output: {
      //     interop: 'auto',
      //     hoistTransitiveImports: false,
      //   }
      // }
    },
    customLogger,
    plugins: [
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
      }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single',
      }),
      react(),
      cfg.outputSingleFile ? viteSingleFile() : undefined,
    ],
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
