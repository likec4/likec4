import type { ViteDevServer } from 'vite'
import type { AppViteOptions } from './config-app'
import { loggable } from '@likec4/log'
import getPort, { portNumbers } from 'get-port'
import isInsideContainer from 'is-inside-container'
import { env, isDevelopment } from 'std-env'
import k from 'tinyrainbow'
import { createServer } from 'vite'
import { appViteConfig } from './config-app'
import { copyUserPublicDir, mkTempPublicDir } from './utils'
import { buildWebcomponent as buildWebcomponentBundle } from './webcomponent'

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
 * Priority: explicit argument > HMR_PORT env var.
 * Returns `undefined` when HMR is disabled, or when no port is given:
 * then Vite serves the HMR WebSocket on the dev server port.
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
  return undefined
}

export type StartDevOptions = Omit<AppViteOptions, 'outputDir' | 'outputSingleFile'> & {
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

/**
 * Starts the dev server of the LikeC4 app (`likec4 start`).
 * Also used to capture images (`likec4 export png`), with HMR disabled.
 */
export async function startDev({
  buildWebcomponent = false,
  hmr = true,
  openBrowser,
  listen,
  port,
  hmrPort,
  userPublicDir,
  allowedHosts,
  ...cfg
}: StartDevOptions): Promise<ViteDevServer> {
  const { config, customLogger: logger, base, webcomponentPrefix } = appViteConfig(cfg)

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
    const source = hmrPort ? ' (explicit)' : ' (env)'
    logger.info(`Enabling HMR: localhost:${resolvedHmrPort}${source}`)
    if (isInsideContainer()) {
      logger.info(k.yellow(`ensure port ${resolvedHmrPort} is published from container`))
    }
  } else if (hmr) {
    logger.info(`Enabling HMR on the dev server port`)
  } else {
    logger.info(`Disabling HMR`)
  }

  const server = await createServer({
    ...config,
    define: {
      ...config.define,
      ...(hmr && { 'process.env.NODE_ENV': '"development"' }),
    },
    mode: hmr ? 'development' : 'production',
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
      // Disable file watching when HMR is disabled to improve performance
      ...(!hmr ? { watch: null } : {}),
      open: openBrowser ?? (!isDevelopment && !isInsideContainer()),
    },
  })

  await server.listen()

  if (buildWebcomponent) {
    logger.info(`Building webcomponent`) // don't wait, we want to start the server asap
    await buildWebcomponentBundle({
      app: cfg.app,
      likec4: cfg.likec4,
      webcomponentPrefix,
      outDir: publicDir,
      base,
      customization: cfg.customization,
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
