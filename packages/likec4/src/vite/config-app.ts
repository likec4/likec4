import { viteAliases } from '@/vite/aliases'
import { consola } from '@likec4/log'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcssPresetMantine from 'postcss-preset-mantine'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { createLikeC4Logger } from '../logger'
import type { LikeC4ViteConfig } from './config-app.prod'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'
import { viteSingleFile } from "vite-plugin-singlefile"
import { outputSingleFile } from 'src/cli/options'

export type { LikeC4ViteConfig }

const _dirname = dirname(fileURLToPath(import.meta.url))
export const pkgRoot = resolve(_dirname, '../..')

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  consola.warn('DEVELOPMENT MODE')
  const useOverviewGraph = cfg?.useOverviewGraph === true
  const customLogger = cfg.customLogger ?? createLikeC4Logger('c4:vite')

  const root = resolve(pkgRoot, 'app')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

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

  // Explicitly set NODE_ENV to development
  process.env['NODE_ENV'] = 'development'

  return {
    isDev: true,
    likec4AssetsDir,
    webcomponentPrefix,
    root,
    languageServices,
    configFile: false,
    mode: 'development',
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_STYLE_BUNDLE__: 'false',
      __USE_OVERVIEW_GRAPH__: useOverviewGraph ? 'true' : 'false',
      __USE_HASH_HISTORY__:  cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"development"',
    },
    resolve: {
      conditions: ['development', 'sources'],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      alias: {
        ...viteAliases(),
        'react-dom/server': resolve(pkgRoot, 'app/react/react-dom-server-mock.ts'),
      },
    },
    clearScreen: false,
    optimizeDeps: {
      force: true,
    },
    base,
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: false,
      copyPublicDir: true,
      assetsInlineLimit: (path, content) => !path.endsWith('.png') && content.length < 1_000_000,
      chunkSizeWarningLimit,
      // commonjsOptions: {
      //       defaultIsModuleExports: (id: string) => {
      //     if (id.includes('react')) {
      //       return true
      //     }
      //     return 'auto'
      //   },
      //   requireReturnsDefault: 'auto',
      //   extensions: ['.js', '.mjs'],
      //   transformMixedEsModules: true,
      //   // requireReturnsDefault: 'namespace',
      //   ignoreTryCatch: 'remove'
      // // },
      // commonjsOptions: {
      //   requireReturnsDefault: 'auto',
      //   extensions: ['.js', '.mjs'],
      //   transformMixedEsModules: true,
      // //   // requireReturnsDefault: 'namespace',
      //   ignoreTryCatch: 'remove'
      // },
      // rollupOptions: {
      //   treeshake: {
      //     preset: 'safest'
      //   },
      //   output: {
      //     interop: 'auto',
      //     hoistTransitiveImports: false,
      //   }
      // }
    },
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine(),
        ],
      },
    },
    customLogger,
    plugins: [
      vanillaExtractPlugin({
        unstable_mode: 'transform',
      }),
      likec4Plugin({
        languageServices,
        useOverviewGraph: useOverviewGraph,
      }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single',
      }),
      react(),
    ].concat(cfg.outputSingleFile ? [viteSingleFile()] : [cssInjectedByJsPlugin({
      injectionCodeFormat: 'esm',
      injectCodeFunction: function(cssCode: string, options) {
        try {
          if (typeof document != 'undefined') {
            const id = options.styleId ?? options.attributes?.['data-vite-dev-id']
            if (!id) {
              throw new Error('styleId or data-vite-dev-id is required')
            }
            // @ts-ignore
            if (window.__likec4styles) {
              // @ts-ignore
              window.__likec4styles.set(id, cssCode)
              return
            }

            var elementStyle = document.createElement('style')

            // SET ALL ATTRIBUTES
            for (const attribute in options.attributes) {
              elementStyle.setAttribute(attribute, options.attributes[attribute]!)
            }

            elementStyle.appendChild(document.createTextNode(cssCode))
            document.head.appendChild(elementStyle)
          }
        } catch (e) {
          console.error('vite-plugin-css-injected-by-js', e)
        }
      },
      dev: {
        enableDev: true,
        removeStyleCodeFunction: function(id) {
          document.querySelectorAll(`[data-vite-dev-id="${id}"]`).forEach((el) => {
            el.parentNode!.removeChild(el)
          })
          // @ts-ignore
          if (window.__likec4styles) {
            // @ts-ignore
            window.__likec4styles.set(id, '')
          }
        },
      },
    })]),
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
