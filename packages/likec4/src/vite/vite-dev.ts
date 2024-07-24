import { viteConfig } from '@/vite/config-app'
import type { LikeC4ViteConfig } from '@/vite/config-app.prod'
import { viteWebcomponentConfig } from '@/vite/config-webcomponent'
import consola from 'consola'
import getPort, { portNumbers } from 'get-port'
import type { ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import { printServerUrls } from './printServerUrls'
import { mkTempPublicDir } from './utils'

type Config = LikeC4ViteConfig & {
  buildWebcomponent?: boolean
  openBrowser?: boolean
  hmr?: boolean
}

export async function viteDev({
  buildWebcomponent = true,
  hmr = true,
  webcomponentPrefix = 'likec4',
  openBrowser,
  ...cfg
}: Config): Promise<ViteDevServer> {
  const { isDev, languageServices, ...config } = await viteConfig({
    ...cfg,
    webcomponentPrefix
  })
  const port = await getPort({
    port: [
      5173,
      ...portNumbers(61000, 61010),
      ...portNumbers(62002, 62010)
    ]
  })
  const hmrPort = await getPort({
    port: portNumbers(24678, 24690)
  })

  const publicDir = await mkTempPublicDir()

  let webcomponentPromise: Promise<unknown> | undefined
  if (buildWebcomponent) {
    const webcomponentConfig = await viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices: languageServices,
      outDir: publicDir,
      base: config.base
    })
    // don't wait, we want to start the server asap
    webcomponentPromise = build({
      ...webcomponentConfig,
      logLevel: 'warn'
    }).catch((err) => {
      consola.warn('webcomponent build failed', err)
      consola.warn('Ignoring error and continuing')
      return Promise.resolve()
    })
  }

  const server = await createServer({
    ...config,
    define: Object.assign(
      {},
      config.define,
      hmr && {
        'process.env.NODE_ENV': '"development"'
      }
    ),
    mode: hmr ? 'development' : config.mode,
    publicDir,
    server: {
      host: '0.0.0.0',
      port,
      hmr: hmr && {
        overlay: true,
        // needed for hmr to work over network aka WSL2
        // host: 'localhost',
        port: hmrPort
      },
      fs: {
        strict: false
      },
      open: openBrowser ?? !isDev
    }
  })

  await server.listen()

  server.config.logger.clearScreen('info')
  printServerUrls(server)

  if (webcomponentPromise) {
    await webcomponentPromise
  }

  return server
}
