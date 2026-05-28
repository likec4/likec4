import { loggable } from '@likec4/log'
import react from '@vitejs/plugin-react'
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
import { copyUserPublicDir, mkTempPublicDir } from './utils'

/**
 * Validates that a port is a valid integer between 1 and 65535.
 * Throws an error if the port is invalid.
 *
 * @param port - The port number to validate
 * @param source - The source of the port (e.g., 'explicitPort', 'HMR_PORT')
 */
function validatePort(port: number, source: string): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid HMR port from ${source}: ${port}. Must be an integer between 1 and 65535.`)
  }
}

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
  if (explicitPort !== undefined) {
    validatePort(explicitPort, 'explicitPort')
    return explicitPort
  }
  if (env['HMR_PORT']) {
    const envPort = Number.parseInt(env['HMR_PORT'], 10)
    validatePort(envPort, 'HMR_PORT')
    return envPort
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
  /**
   * Hostnames allowed to respond to (Vite `server.allowedHosts`).
   * When omitted, all hosts are allowed.
   */
  allowedHosts?: string[] | undefined
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
  userPublicDir,
  allowedHosts,
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
  if (userPublicDir) {
    await copyUserPublicDir(userPublicDir, publicDir)
  }

  const host = listen ?? (isInsideContainer() ? '0.0.0.0' : 'localhost')

  const resolvedHmrPort = await resolveHmrPort(hmrPort, hmr)
  if (hmr && resolvedHmrPort !== undefined) {
    const source = hmrPort ? ' (explicit)' : env['HMR_PORT'] ? ' (env)' : ' (auto-discovered)'
    logger.info(`Enabling HMR: localhost:${resolvedHmrPort}${source}`)
    config.plugins = [
      react(),
      ...config.plugins,
    ]
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
    server: {
      host,
      allowedHosts: allowedHosts && allowedHosts.length > 0 ? allowedHosts : true,
      port,
      hmr: hmr && {
        overlay: true,
        // needed for hmr to work over network aka WSL2
        // host,
        ...(resolvedHmrPort !== undefined ? { port: resolvedHmrPort } : {}),
      },
      fs: {
        strict: false,
      },
      open: openBrowser ?? (!isDev && !isInsideContainer()),
    },
  })

  await server.listen()

  if (buildWebcomponent) {
    const webcomponentConfig = viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices: languageServices,
      outDir: publicDir,
      base: config.base,
    })
    logger.info(`Building webcomponent`) // don't wait, we want to start the server asap
    await build({
      ...webcomponentConfig,
      logLevel: 'warn',
    }).catch(err => {
      logger.warn(loggable(err))
      logger.warn('webcomponent build failed, ignoring error and continue')
    })
  } else {
    logger.info(`Skip webcomponent build`)
  }

  return server
}
