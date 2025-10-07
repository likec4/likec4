import { type LikeC4ViteConfig, viteConfig } from '@/vite/config-app'
import { viteWebcomponentConfig } from '@/vite/config-webcomponent'
import { loggable } from '@likec4/log'
import getPort, { portNumbers } from 'get-port'
import isInsideContainer from 'is-inside-container'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import k from 'tinyrainbow'
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
  title,
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
    title,
  })
  const logger = config.customLogger
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

  const host = listen ?? (isInsideContainer() ? '0.0.0.0' : 'localhost')

  if (hmr) {
    logger.info(`Enabling HMR: localhost:${hmrPort}`)
    if (isInsideContainer()) {
      logger.info(k.yellow(`ensure port ${hmrPort} is published from container`))
    }
  } else {
    logger.info(`Disabling HMR`)
  }

  const server = await createServer({
    ...config,
    define: hmr
      ? {
        ...config.define,
        'process.env.NODE_ENV': '"development"',
      }
      : config.define,
    mode: hmr ? 'development' : config.mode,
    publicDir,
    server: {
      host,
      // TODO: temprorary enable access to any host
      // This is not recommended as it can be a security risk - https://vite.dev/config/server-options#server-allowedhosts
      // Enabled after request in discord support just to check if it solves the problem
      allowedHosts: true,
      port,
      hmr: hmr && {
        overlay: true,
        // needed for hmr to work over network aka WSL2
        // host,
        port: hmrPort,
      },
      fs: {
        strict: false,
      },
      open: openBrowser ?? (!isDev && !isInsideContainer()),
    },
  })

  await server.listen()

  if (buildWebcomponent) {
    logger.info(`Building webcomponent`) // don't wait, we want to start the server asap
    ;(async () => {
      try {
        const webcomponentConfig = await viteWebcomponentConfig({
          webcomponentPrefix,
          languageServices: languageServices,
          outDir: publicDir,
          base: config.base,
        })
        await build({
          ...webcomponentConfig,
          logLevel: 'warn',
        })
      } catch (err) {
        logger.warn(loggable(err))
        logger.warn('webcomponent build failed, ignoring error and continue')
      }
    })()
  } else {
    logger.info(`Skip webcomponent build`)
  }

  return server
}
