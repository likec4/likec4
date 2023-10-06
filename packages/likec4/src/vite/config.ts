import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { isNil } from 'remeda'
// import { createRequire } from 'module'
import k from 'kleur'
import { fileURLToPath } from 'node:url'
import type { InlineConfig } from 'vite'
import type { LanguageServices } from '../language-services'
import { mkLanguageServices } from '../language-services'
import { likec4Plugin } from './plugin'
//
const _dirname = dirname(fileURLToPath(import.meta.url))

export const getAppRoot = () => {
  // if (fs.existsSync(join(_dirname, '../../typings-for-build/app/index.html'))) {
  //   // published/compiled folder of our app
  //   return join(_dirname, '../../typings-for-build/app')
  // }
  return join(_dirname, '../../app')
}

export type LikeC4ViteConfig =
  | {
      languageServices: LanguageServices
      workspaceDir?: never
      outputDir?: string
    }
  | {
      languageServices?: never
      workspaceDir: string
      outputDir?: string
    }

export const viteConfig = async (cfg?: LikeC4ViteConfig) => {
  const root = getAppRoot()
  if (!fs.existsSync(root)) {
    throw new Error(`app root does not exist: ${root}`)
  }
  const customLogger = createLikeC4Logger('c4:vite')

  customLogger.info(`${k.dim('app root')} ${root}`)

  let languageServices
  if (cfg) {
    languageServices =
      cfg.languageServices ??
      (await mkLanguageServices({
        workspaceDir: cfg.workspaceDir,
        logValidationErrors: true
      }))
  } else {
    languageServices = await mkLanguageServices({
      workspaceDir: process.cwd(),
      logValidationErrors: true
    })
  }

  return {
    root,
    languageServices,
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-inspector'
      ],
      alias: {
        '~': resolve(root, './src')
      }
    },
    build: {
      outDir: cfg?.outputDir ?? resolve(languageServices.workspace, 'dist'),
      emptyOutDir: isNil(cfg?.outputDir),
      assetsInlineLimit: 500 * 1000,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 5 * 1000 * 1000
    },
    css: {
      postcss: resolve(root, 'postcss.config.cjs')
    },
    customLogger,
    optimizeDeps: {
      // TODO this is wrong, should be fullpartghs
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-inspector',
        'konva',
        'konva/lib',
        '@react-spring/konva',
        'react-konva'
      ]
    },
    plugins: [
      react({
        // plugins: [
        //   ['@swc-jotai/debug-label', {}],
        //   ['@swc-jotai/react-refresh', {}]
        // ]
      }),
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig & LikeC4ViteConfig
}
