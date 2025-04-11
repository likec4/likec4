import { viteAliases } from '@/vite/aliases'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import type { LikeC4 } from '../LikeC4'
import { type ViteLogger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin/plugin'
import { chunkSizeWarningLimit, viteAppRoot, viteLogger } from './utils'

export type LikeC4ViteConfig = {
  customLogger?: ViteLogger
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
  useOverviewGraph?: boolean | undefined
  likec4AssetsDir: string
  outputSingleFile?: boolean | undefined
}

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  const customLogger = cfg.customLogger ?? viteLogger
  const root = viteAppRoot()
  const useOverviewGraph = cfg?.useOverviewGraph === true
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('output') + ' ' + k.dim(outDir))

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

  return {
    isDev: false,
    likec4AssetsDir,
    webcomponentPrefix,
    root,
    languageServices,
    clearScreen: false,
    base,
    resolve: {
      conditions: ['production'],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      alias: {
        ...viteAliases(),
        'likec4/previews': likec4AssetsDir,
      },
    },
    configFile: false,
    mode: 'production',
    optimizeDeps: {
      force: true,
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_OVERVIEW_GRAPH__: useOverviewGraph ? 'true' : 'false',
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      outDir,
      modulePreload: false,
      emptyOutDir: false,
      sourcemap: false,
      cssCodeSplit: true,
      cssMinify: true,
      minify: true,
      copyPublicDir: true,
      chunkSizeWarningLimit,
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          hoistTransitiveImports: false,
          compact: true,
        },
      },
    },
    customLogger,
    plugins: [
      react(),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        useOverviewGraph: useOverviewGraph,
      }),
    ].concat(cfg.outputSingleFile ? [viteSingleFile()] : []),
  } satisfies InlineConfig & Omit<LikeC4ViteConfig, 'customLogger'> & { isDev: boolean }
}
