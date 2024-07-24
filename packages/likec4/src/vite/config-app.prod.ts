import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import k from 'picocolors'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, viteAppRoot } from './utils'

export type LikeC4ViteConfig = {
  languageServices: LanguageServices
  outputDir?: string | undefined
  base?: string | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
}

export const viteConfig = async ({ languageServices, ...cfg }: LikeC4ViteConfig) => {
  const customLogger = createLikeC4Logger('c4:vite')
  const root = viteAppRoot()
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
    webcomponentPrefix,
    root,
    languageServices,
    clearScreen: false,
    base,
    resolve: {
      alias: {
        'likec4/icons': resolve(root, '../../icons')
      }
    },
    configFile: false,
    mode: 'production',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        '@nanostores/react',
        'nanostores'
      ],
      noDiscovery: true,
      force: true
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_SHADOW_STYLE__: 'false',
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"production"'
    },
    build: {
      outDir,
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
        },
        requireReturnsDefault: 'auto'
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended'
        },
        output: {
          interop: 'auto',
          hoistTransitiveImports: false
        }
      }
    },
    customLogger,
    plugins: [
      react(),
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
