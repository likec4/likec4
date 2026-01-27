import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LikeC4 } from '../../LikeC4'
import { printServerUrls } from '../../vite/printServerUrls'
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
}

export async function handler({
  path,
  useDotBin,
  webcomponentPrefix,
  title,
  useHashHistory,
  enableWebcomponent = true,
  enableHMR = true,
  base,
  listen,
  port,
}: HandlerParams) {
  // Explicitly set NODE_ENV to development
  if (enableHMR) {
    process.env['NODE_ENV'] = 'development'
  }
  const languageServices = await LikeC4.fromWorkspace(path, {
    // logger: 'vite',
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
    languageServices,
    useHashHistory,
    likec4AssetsDir,
    listen,
    port,
  })

  server.config.logger.clearScreen('info')
  printServerUrls(server)

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
