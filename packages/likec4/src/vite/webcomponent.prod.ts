import { createLikeC4Logger } from '@/logger'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import type { InlineConfig } from 'vite'
import type { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'
//
const _dirname = dirname(fileURLToPath(import.meta.url))

export type LikeC4ViteWebcomponentConfig = {
  languageServices: LanguageServices
  outDir: string
  base: string
  filename?: string
}

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  filename = 'likec4-views.js'
}: LikeC4ViteWebcomponentConfig) {
  const customLogger = createLikeC4Logger('c4:lib')

  const root = resolve(_dirname, '../__app__')
  if (!fs.existsSync(root)) {
    customLogger.error(`likec4 app root does not exist: ${root}`)
    throw new Error(`likec4 app root does not exist: ${root}`)
  }

  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    root,
    clearScreen: false,
    base,
    configFile: false,
    publicDir: false,
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    optimizeDeps: {
      noDiscovery: true,
      include: []
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
      }
    },
    customLogger,
    plugins: [
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig
}
