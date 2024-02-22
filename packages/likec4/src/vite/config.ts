import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import { isCI } from 'ci-info'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import postcssNested from 'postcss-nested'
import type { Alias, InlineConfig, Logger } from 'vite'
import pkg from '../../package.json' assert { type: 'json' }
import { LanguageServices } from '../language-services'
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

function resolveAliases(aliases: Record<string, string>, logger: Logger): Array<Alias> {
  const resolved = [] as Array<Alias>
  Array.from(Object.entries(aliases)).forEach(([key, src]) => {
    if (!fs.existsSync(src)) {
      logger.error(`${k.bgRed(k.white(key))} does not exist ${src}`)
      return
    }
    logger.info(`${key} ${k.dim('resolve to')} ${src}`)
    resolved.push({ find: key, replacement: src })
  })
  return resolved
}

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

  customLogger.info(`${k.dim('version')} ${pkg.version}`)

  const [root, isDev] = getAppRoot()
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  if (isDev) {
    customLogger.warn(`${k.dim('dev app root')} ${root}`)
  } else {
    customLogger.info(`${k.dim('app root')} ${root}`)
  }

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  const outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.dim('outDir') + ' ' + outDir)

  let coreSrc, diagramsSrc

  if (isDev) {
    coreSrc = resolve(_dirname, '../../../core/src/index.ts')
    diagramsSrc = resolve(_dirname, '../../../diagrams/src/index.ts')
  } else {
    coreSrc = resolve(_dirname, '../@likec4/core/index.js')
    diagramsSrc = resolve(_dirname, '../@likec4/diagrams/index.js')
  }

  const aliases = resolveAliases(
    {
      ['@likec4/core']: coreSrc,
      ['@likec4/diagrams']: diagramsSrc
    },
    customLogger
  )

  let base = '/'
  if (cfg?.base) {
    base = cfg.base
    if (!base.startsWith('/')) {
      base = '/' + base
    }
    if (!base.endsWith('/')) {
      base = base + '/'
    }
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }

  return {
    isDev,
    root,
    languageServices,
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: [...aliases]
    },
    clearScreen: false,
    base,
    build: {
      outDir,
      reportCompressedSize: isDev || !isCI,
      // 200Kb
      assetsInlineLimit: 200 * 1024,
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 2_000_000,
      commonjsOptions: {
        esmExternals: true,
        sourceMap: false
      }
    },
    css: {
      postcss: {
        plugins: [autoprefixer(), postcssNested()]
      },
      modules: {
        localsConvention: 'camelCase'
      }
    },
    customLogger,
    optimizeDeps: {
      include: [
        'react-dom',
        'react-dom/client',
        'react',
        'react-reconciler',
        'scheduler',
        'rambdax',
        'remeda',
        'jotai',
        'jotai/utils',
        '@radix-ui/react-icons',
        '@radix-ui/themes',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        'react-konva',
        'konva',
        'react-accessible-treeview',
        '@react-hookz/web',
        '@react-spring/core',
        '@react-spring/animated',
        '@react-spring/shared',
        '@react-spring/konva',
        '@use-gesture/core',
        '@use-gesture/react',
        ...(!isDev ? ['@likec4/core', '@likec4/diagrams'] : [])
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
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
