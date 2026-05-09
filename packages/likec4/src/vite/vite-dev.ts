import { loggable } from '@likec4/log'
import getPort, { portNumbers } from 'get-port'
import isInsideContainer from 'is-inside-container'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { env } from 'std-env'
import k from 'tinyrainbow'
import type { SetOptional } from 'type-fest'
import type { ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import type { LikeC4ViteConfig } from './config-app'
import { viteConfig } from './config-app'
import { viteWebcomponentConfig } from './config-webcomponent'
import { mkTempPublicDir } from './utils'

/**
 * Resolves the HMR WebSocket port to use.
 * Priority: explicit argument > HMR_PORT env var > auto-discovered from 24678–24690.
 * When HMR is disabled, returns `undefined`.
 *
 * Exported for testing.
 */
export async function resolveHmrPort(
  explicitPort: number | undefined,
  hmrEnabled: boolean,
): Promise<number | undefined> {
  if (!hmrEnabled) {
    return undefined
  }
  const port = explicitPort ?? (env['HMR_PORT'] ? parseInt(env['HMR_PORT'], 10) : undefined)
  if (port) {
    return port
  }
  return getPort({ port: portNumbers(24678, 24690) })
}

type Config = SetOptional<LikeC4ViteConfig, 'likec4AssetsDir'> & {
  buildWebcomponent?: boolean
  openBrowser?: boolean
  hmr?: boolean
  listen?: string | undefined
  port?: number | undefined
  hmrPort?: number | undefined
}

export async function viteDev({
  buildWebcomponent = false,
  hmr = true,
  webcomponentPrefix = 'likec4',
  title,
  languageServices,
  likec4AssetsDir,
  openBrowser,
  listen,
  port,
  hmrPort,
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

  // if port not given as argument, try to get from env
  port ??= env['PORT'] ? parseInt(env['PORT'], 10) : undefined

  // if port is not specified, use default
  if (!port) {
    port = await getPort({
      port: [
        5173,
        5174,
        ...portNumbers(61000, 61010),
        ...portNumbers(62002, 62010),
      ],
    })
  }
  const publicDir = await mkTempPublicDir()

  const host = listen ?? (isInsideContainer() ? '0.0.0.0' : 'localhost')

  const resolvedHmrPort = await resolveHmrPort(hmrPort, hmr)
  if (hmr && resolvedHmrPort !== undefined) {
    const source = hmrPort ? ' (explicit)' : ''
    logger.info(`Enabling HMR: localhost:${resolvedHmrPort}${source}`)
    if (isInsideContainer()) {
      logger.info(k.yellow(`ensure port ${resolvedHmrPort} is published from container`))
    }
  } else if (!hmr) {
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
    optimizeDeps: {
      force: true,
    },
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
        port: resolvedHmrPort,
      },
      fs: {
        strict: false,
      },
      open: openBrowser ?? (!isDev && !isInsideContainer()),
    },
  })

  if (buildWebcomponent) {
    const webcomponentConfig = viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices: languageServices,
      outDir: publicDir,
      base: config.base,
    })
    logger.info(`Building webcomponent`) // don't wait, we want to start the server asap
    build({
      ...webcomponentConfig,
      logLevel: 'warn',
    }).catch(err => {
      logger.warn(loggable(err))
      logger.warn('webcomponent build failed, ignoring error and continue')
    })
  } else {
    logger.info(`Skip webcomponent build`)
  }

  await server.listen()

  return server
}
