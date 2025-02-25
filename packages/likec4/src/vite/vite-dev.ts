import { type LikeC4ViteConfig, viteConfig } from '@/vite/config-app'
import { viteWebcomponentConfig } from '@/vite/config-webcomponent'
import { logger as consola } from '@likec4/log'
import getPort, { portNumbers } from 'get-port'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SetOptional } from 'type-fest'
import type { ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import { mkTempPublicDir } from './utils'

type Config = SetOptional<LikeC4ViteConfig, 'likec4AssetsDir'> & {
  buildWebcomponent?: boolean
  openBrowser?: boolean
  hmr?: boolean
  listen?: string | undefined
}

export async function viteDev({
  buildWebcomponent = true,
  hmr = true,
  webcomponentPrefix = 'likec4',
  languageServices,
  likec4AssetsDir,
  openBrowser,
  listen,
  ...cfg
}: Config): Promise<ViteDevServer> {
  likec4AssetsDir ??= await mkdtemp(join(tmpdir(), '.likec4-assets-'))

  const { isDev, ...config } = await viteConfig({
    ...cfg,
    languageServices,
    likec4AssetsDir,
    webcomponentPrefix,
  })
  const port = await getPort({
    port: [
      5173,
      ...portNumbers(61000, 61010),
      ...portNumbers(62002, 62010),
    ],
  })
  const hmrPort = await getPort({
    port: portNumbers(24678, 24690),
  })

  const publicDir = await mkTempPublicDir()

  let webcomponentPromise: Promise<unknown> | undefined
  if (buildWebcomponent) {
    const webcomponentConfig = await viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices: languageServices,
      outDir: publicDir,
      base: config.base,
    })
    // don't wait, we want to start the server asap
    webcomponentPromise = build({
      ...webcomponentConfig,
      logLevel: 'warn',
    }).catch((err) => {
      consola.warn('webcomponent build failed', { err })
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
        'process.env.NODE_ENV': '"development"',
      },
    ),
    mode: hmr ? 'development' : config.mode,
    publicDir,
    server: {
      host: listen ?? '127.0.0.1',
      port,
      hmr: hmr && {
        overlay: true,
        // needed for hmr to work over network aka WSL2
        // host: 'localhost',
        port: hmrPort,
      },
      fs: {
        strict: false,
      },
      open: openBrowser ?? !isDev,
    },
  })

  await server.listen()

  if (webcomponentPromise) {
    await webcomponentPromise
  }

  return server
}
