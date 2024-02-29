import { createLikeC4Logger } from '@/logger'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { isCI } from 'ci-info'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'picocolors'
import postcssPresetMantine from 'postcss-preset-mantine'
import type { Alias, InlineConfig, Logger } from 'vite'
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

  const [root, isDev] = getAppRoot()
  if (!fs.existsSync(root)) {
    customLogger.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  if (isDev) {
    customLogger.info(`${k.cyan('dev app root')} ${k.dim(root)}`)
  } else {
    customLogger.info(`${k.cyan('app root')} ${k.dim(root)}`)
  }

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  const outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  const sources = {
    core: resolve(_dirname, isDev ? '../../../core/src/index.ts' : '../@likec4/core/index.js'),
    diagram: resolve(_dirname, isDev ? '../../../diagram/src/index.ts' : '../@likec4/diagram/index.js'),
    diagrams: resolve(_dirname, isDev ? '../../../diagrams/src/index.ts' : '../@likec4/diagrams/index.js')
  }

  const aliases = resolveAliases(
    {
      ['@likec4/core']: sources.core,
      ['@likec4/diagram']: sources.diagram,
      ['@likec4/diagrams']: sources.diagrams
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
  }
  if (base !== '/') {
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
        plugins: [
          postcssPresetMantine()
        ]
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
        'react-accessible-treeview',
        '@react-hookz/web',
        ...(isDev ? [] : ['@likec4/core', '@likec4/diagram', '@likec4/diagrams'])
      ]
    },
    plugins: [
      react({
        // plugins: [
        //   ['@swc-jotai/debug-label', {}],
        //   ['@swc-jotai/react-refresh', {}]
        // ]
      }),
      TanStackRouterVite({
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single'
      }),
      likec4Plugin({ languageServices })
    ]
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
