import { createLikeC4Logger } from '@/logger'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import consola from 'consola'
import fs from 'node:fs'
import { resolve } from 'node:path'
import k from 'picocolors'
import postcssPresetMantine from 'postcss-preset-mantine'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import type { LikeC4ViteConfig } from './config-app.prod'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'

export const viteConfig = async ({ languageServices, ...cfg }: LikeC4ViteConfig) => {
  consola.warn('DEVELOPMENT MODE')
  const customLogger = createLikeC4Logger('c4:vite')

  const root = resolve('app')
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
    webcomponentPrefix,
    root,
    languageServices,
    configFile: false,
    mode: 'development',
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_SHADOW_STYLE__: 'false',
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"development"'
    },
    resolve: {
      alias: {
        'likec4/icons': resolve('../icons'),
        'likec4/react': resolve('app/react/components/index.ts'),
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts'),
        'react-dom/server': resolve('app/react/react-dom-server-mock.ts')
      }
    },
    clearScreen: false,
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        'nanostores',
        '@nanostores/react'
      ],
      force: true
    },
    base,
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: false,
      copyPublicDir: true,
      assetsInlineLimit: 1_000_000,
      chunkSizeWarningLimit
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
          postcssPresetMantine()
        ]
      }
    },
    customLogger,
    plugins: [
      vanillaExtractPlugin({
        unstable_mode: 'transform'
      }),
      likec4Plugin({ languageServices }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single'
      }),
      react(),
      cssInjectedByJsPlugin({
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
          }
        }
      })
    ]
  } satisfies InlineConfig & LikeC4ViteConfig & { isDev: boolean }
}
