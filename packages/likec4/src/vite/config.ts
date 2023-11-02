import { createLikeC4Logger } from '@/logger'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import { isNil } from 'remeda'
import type { InlineConfig, Logger } from 'vite'
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

function resolveAliases(aliases: Record<string, string>, logger: Logger): Record<string, string> {
  const resolved = {}
  Array.from(Object.entries(aliases)).forEach(([key, src]) => {
    if (!fs.existsSync(src)) {
      logger.error(`${k.bgRed(k.white(key))} does not exist ${src}`)
      return
    }
    logger.info(`${key} ${k.dim('resolve to')} ${src}`)
    Object.assign(resolved, { [key]: src })
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

  const [root, isDev] = getAppRoot()
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  customLogger.info(`${k.dim('app root')} ${root}`)

  const languageServices =
    cfg?.languageServices ??
    (await mkLanguageServices({
      workspaceDir: cfg?.workspaceDir ?? process.cwd(),
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
    customLogger.info(`${k.dim('app base url')} ${base}`)
  }

  return {
    isDev,
    root,
    languageServices,
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      alias: {
        '~': resolve(root, './src'),
        ...aliases
      }
    },
    clearScreen: false,
    base,
    build: {
      outDir,
      assetsInlineLimit: 500 * 1000,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 5 * 1000 * 1000,
      commonjsOptions: {
        esmExternals: true,
        sourceMap: false
      }
    },
    css: {
      postcss: resolve(root, 'postcss.config.cjs'),
      modules: {
        localsConvention: 'camelCaseOnly'
      }
    },
    customLogger,
    optimizeDeps: {
      include: isDev
        ? []
        : [
            '@radix-ui/react-icons',
            '@radix-ui/themes',
            '@likec4/core',
            '@likec4/diagrams',
            '@react-spring/konva',
            '@use-gesture/react',
            'classnames',
            'remeda',
            'rambdax',
            'jotai',
            'konva',
            'react-accessible-treeview',
            'react-dom',
            'react-dom/client',
            'react-konva',
            'react-konva/es/ReactKonvaCore',
            'konva/lib/Core',
            'konva/lib/shapes/Rect',
            'konva/lib/shapes/Text',
            'konva/lib/shapes/Path',
            'konva/lib/shapes/Circle',
            'konva/lib/shapes/Line',
            'konva/lib/shapes/Image',
            'konva/lib/shapes/Ellipse',
            'react',
            'react/jsx-dev-runtime',
            'react/jsx-runtime'
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
