import { resolve } from 'node:path'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger, type ViteLogger } from '../logger'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, viteAppRoot } from './utils'

export type LikeC4ViteConfig = {
  customLogger?: ViteLogger
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
  useOverviewGraph?: boolean | undefined
  likec4AssetsDir: string
}

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  const customLogger = cfg.customLogger ?? createLikeC4Logger('c4:vite')
  const root = viteAppRoot()
  const useOverviewGraph = cfg?.useOverviewGraph === true
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('output') + ' ' + k.dim(outDir))

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

  return {
    isDev: false,
    likec4AssetsDir,
    webcomponentPrefix,
    root,
    languageServices,
    clearScreen: false,
    base,
    resolve: {
      alias: {
        'likec4/previews': likec4AssetsDir
        // 'likec4/icons': resolve(root, '../../icons')
      }
    },
    configFile: false,
    mode: 'production',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'nanostores',
        '@nanostores/react'
      ],
      force: true
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_STYLE_BUNDLE__: 'false',
      __USE_OVERVIEW_GRAPH__: useOverviewGraph ? 'true' : 'false',
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"production"'
    },
    build: {
      outDir,
      modulePreload: false,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      cssMinify: true,
      minify: true,
      copyPublicDir: true,
      chunkSizeWarningLimit,
      commonjsOptions: {
        defaultIsModuleExports: (id: string) => {
          if (id.includes('react')) {
            return true
          }
          return 'auto'
        }
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended'
        },
        output: {
          hoistTransitiveImports: false,
          compact: true
        }
      }
    },
    customLogger,
    plugins: [
      likec4Plugin({
        languageServices,
        useOverviewGraph
      })
    ]
  } satisfies InlineConfig & Omit<LikeC4ViteConfig, 'customLogger'> & { isDev: boolean }
}
