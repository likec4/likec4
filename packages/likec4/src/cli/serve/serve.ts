import { fromWorkspace } from '@likec4/language-services/node'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import k from 'tinyrainbow'
import { normalizePath } from 'vite'
import { printServerUrls } from '../../vite/printServerUrls'
import { relativeToCwd } from '../../vite/utils'
import { viteDev } from '../../vite/vite-dev'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined

  useHashHistory: boolean | undefined

  webcomponentPrefix: string

  /*
   * base title of the app pages
   */
  title: string | undefined

  /**
   * default color scheme of the app
   */
  theme?: 'light' | 'dark' | undefined

  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined

  /**
   * The loaded app config, its changes require a restart
   */
  appConfigFile?: string | undefined

  /**
   * ip address of the network interface to listen on
   * @default '127.0.0.1'
   */
  listen?: string | undefined

  /**
   * port number for the dev server
   * @default 5173
   */
  port?: number | undefined

  /**
   * Enable webcomponent build
   * @default true
   */
  enableWebcomponent?: boolean | undefined

  /**
   * Enable HMR
   * @default true
   */
  enableHMR?: boolean | undefined

  /**
   * port number for the HMR WebSocket server
   * @default auto-discovered from 24678-24690
   */
  hmrPort?: number | undefined

  /**
   * Optional user-provided directory whose files are copied to the dev server
   * (Vite publicDir).
   */
  userPublicDir?: string | undefined

  /**
   * Hostnames allowed to access the dev server (maps to Vite's
   * `server.allowedHosts`). When omitted, all hosts are allowed.
   * @see https://vite.dev/config/server-options#server-allowedhosts
   */
  allowedHosts?: string[] | undefined
}

/** Starts the LikeC4 dev server (Vite) for the given workspace path. */
export async function handler({
  path,
  useDotBin,
  webcomponentPrefix,
  title,
  theme,
  customization,
  appConfigFile,
  useHashHistory,
  enableWebcomponent = true,
  enableHMR = true,
  base,
  listen,
  port,
  hmrPort,
  userPublicDir,
  allowedHosts,
}: HandlerParams) {
  // Explicitly set NODE_ENV to development
  if (enableHMR) {
    process.env['NODE_ENV'] = 'development'
  }
  const languageServices = await fromWorkspace(path, {
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: enableHMR,
  })
  const likec4AssetsDir = await mkdtemp(join(tmpdir(), '.likec4-assets-'))
  // const likec4AssetsDir = join(languageServices.workspace, '.likec4-assets')
  // await mkdir(likec4AssetsDir, { recursive: true })

  const server = await viteDev({
    buildWebcomponent: enableWebcomponent,
    hmr: enableHMR,
    base,
    webcomponentPrefix,
    title,
    theme,
    customization,
    languageServices,
    useHashHistory,
    likec4AssetsDir,
    listen,
    port,
    hmrPort,
    userPublicDir,
    allowedHosts,
  })

  server.config.logger.clearScreen('info')
  printServerUrls(server)

  if (appConfigFile) {
    // The config is applied on start only
    const configFile = normalizePath(appConfigFile)
    server.watcher.add(appConfigFile)
    server.watcher.on('change', (file) => {
      if (normalizePath(file) === configFile) {
        server.config.logger.warn(k.yellow(`${relativeToCwd(appConfigFile)} changed, restart to apply`))
      }
    })
  }

  // if (!useOverview) {
  //   return
  // }
  // const views = await languageServices.diagrams()

  // if (hasAtLeast(views, 1)) {
  //   const logger = createLikeC4Logger('c4:export')
  //   const serverUrl = resolveServerUrl(server)
  //   if (!serverUrl) {
  //     logger.error('no preview server url')
  //     return
  //   }
  //   logger.info(k.cyan(`wait 5sec before generating previews`))
  //   await delay(5000)

  //   try {
  //     await exportViewsToPNG({
  //       serverUrl,
  //       logger,
  //       views,
  //       theme: 'light',
  //       output: likec4AssetsDir,
  //       outputType: 'flat',
  //     })

  //     await delay(1000)

  //     logger.info(k.yellow(`Note: changes in sources do not trigger preview updates, restart is required`))
  //   } catch (error) {
  //     logger.error(k.red('Failed to generate previews'))
  //     logger.error(error)
  //   }
  // } else {
  //   server.config.logger.warn('no views found, no previews generated')
  // }
}
