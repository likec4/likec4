import { createLikeC4Logger } from '@/logger'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { LanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'
//
const _dirname = dirname(fileURLToPath(import.meta.url))

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
  const customLogger = createLikeC4Logger('c4:vite')

  const root = resolve(_dirname, '../__app__')
  if (!fs.existsSync(root)) {
    customLogger.error(`likec4 app root does not exist: ${root}`)
    throw new Error(`likec4 app root does not exist: ${root}`)
  }

  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  const outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('output') + ' ' + k.dim(outDir))

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
    isDev: false,
    root,
    languageServices,
    clearScreen: false,
    base,
    configFile: false,
    resolve: {
      alias: {
        '@emotion/is-prop-valid': 'fast-equals'
      }
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      copyPublicDir: true,
      chunkSizeWarningLimit,
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      }
    },
    customLogger,
    plugins: [
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
