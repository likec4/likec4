import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
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
      outputDir?: string
    }
  | {
      languageServices?: never
      workspaceDir: string
      outputDir?: string
    }

export const viteConfig = async (cfg?: LikeC4ViteConfig) => {
  const customLogger = createLikeC4Logger('c4:vite')

  const [root, isDev] = getAppRoot()
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

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

  const aliases = {}
  if (isDev) {
    const diagramsSrc = resolve(_dirname, '../../../diagrams/src/index.ts')
    if (!fs.existsSync(diagramsSrc)) {
      customLogger.error(`@likec4/diagrams does not exist: ${diagramsSrc}`)
    } else {
      customLogger.info(`${k.dim('resolve @likec4/diagrams to')} ${diagramsSrc}`)
      Object.assign(aliases, {
        '@likec4/diagrams': diagramsSrc
      })
    }
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
        '~': resolve(root, './src'),
        ...aliases
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
