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
import { LanguageServices } from '../language-services'
import type { LikeC4ViteConfig } from './config-app.prod'
import { likec4Plugin } from './plugin'
import { chunkSizeWarningLimit } from './utils'

export const viteConfig = async (cfg?: LikeC4ViteConfig) => {
  consola.warn('DEVELOPMENT MODE')
  const customLogger = createLikeC4Logger('c4:vite')

  const root = resolve('app')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  const outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

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

  const webcomponentPrefix = cfg?.webcomponentPrefix ?? 'likec4'

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
        'likec4/react': resolve('app/react/components/index.ts'),
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts'),
        'react-dom/server': resolve('app/react/react-dom-server-mock.ts')
      }
    },
    clearScreen: false,
    base,
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      copyPublicDir: true,
      // 500Kb
      assetsInlineLimit: 500 * 1024,
      chunkSizeWarningLimit,
      commonjsOptions: {
        ignoreTryCatch: 'remove'
      }
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
      react(),
      likec4Plugin({ languageServices }),
      TanStackRouterVite({
        routeFileIgnorePattern: '.css.ts',
        generatedRouteTree: resolve(root, 'src/routeTree.gen.ts'),
        routesDirectory: resolve(root, 'src/routes'),
        quoteStyle: 'single'
      }),
      vanillaExtractPlugin({}),
      cssInjectedByJsPlugin({
        injectionCodeFormat: 'esm',
        styleId: () => 'likec4-style-' + Math.random().toString(36).slice(4),
        injectCodeFunction: function injectCodeCustomRunTimeFunction(cssCode: string, options) {
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
          removeStyleCodeFunction: function removeStyleCode(id) {
            document.querySelectorAll(`style[data-vite-dev-id="${id}"]`).forEach((el) => el.remove())
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
