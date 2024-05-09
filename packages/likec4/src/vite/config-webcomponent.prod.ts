import { createLikeC4Logger } from '@/logger'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import type { InlineConfig } from 'vite'
import type { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot } from './utils'

export type LikeC4ViteWebcomponentConfig = {
  webcomponentPrefix: string | undefined
  languageServices: LanguageServices
  outDir: string
  base: string
  filename?: string
}

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js'
}: LikeC4ViteWebcomponentConfig) {
  const customLogger = createLikeC4Logger('c4:lib')
  const root = viteAppRoot()
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    root,
    clearScreen: false,
    base,
    configFile: false,
    publicDir: false,
    mode: 'production',
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      'process.env.NODE_ENV': '"production"'
    },
    optimizeDeps: {
      noDiscovery: true,
      include: []
    },
    esbuild: {
      ...JsBanners
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit,
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      },
      lib: {
        entry: 'src/lib/webcomponent.mjs',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views'
      },
      rollupOptions: {
        output: {
          compact: true
        }
      }
    },
    customLogger,
    plugins: [
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig
}
