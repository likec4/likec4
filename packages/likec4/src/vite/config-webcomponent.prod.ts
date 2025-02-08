import { createLikeC4Logger } from '../logger'

import { viteAliases } from '@/vite/aliases'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit, JsBanners, viteAppRoot } from './utils'

export type LikeC4ViteWebcomponentConfig = {
  webcomponentPrefix: string | undefined
  languageServices: LikeC4
  outDir: string
  base: string
  filename?: string
}

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
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
    resolve: {
      conditions: ['production'],
      alias: viteAliases(),
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      'process.env.NODE_ENV': '"production"',
    },
    esbuild: {
      ...JsBanners,
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      // 100Kb
      assetsInlineLimit: 100 * 1024,
      chunkSizeWarningLimit,
      lib: {
        entry: 'webcomponent/webcomponent.js',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views',
      },
      commonjsOptions: {
        defaultIsModuleExports: (id: string) => {
          if (id.includes('react')) {
            return true
          }
          return 'auto'
        },
        requireReturnsDefault: 'auto',
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          format: 'iife',
          hoistTransitiveImports: false,
          compact: true,
        },
      },
    },
    customLogger,
    plugins: [
      likec4Plugin({
        languageServices,
        useOverviewGraph: false,
      }),
    ],
  } satisfies InlineConfig
}
