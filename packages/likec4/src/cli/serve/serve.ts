import { delay } from '@likec4/core'
import { DEV } from 'esm-env'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import { exportViewsToPNG } from '../../cli/export/png/handler'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { printServerUrls, resolveServerUrl } from '../../vite/printServerUrls'
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

  /**
   * overview all diagrams as graph
   */
  useOverview?: boolean | undefined

  webcomponentPrefix: string
}

export async function handler({
  path,
  useDotBin,
  webcomponentPrefix,
  useHashHistory,
  useOverview = false,
  base,
}: HandlerParams) {
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm',
  })
  const likec4AssetsDir = await mkdtemp(join(tmpdir(), '.likec4-assets-'))
  // const likec4AssetsDir = join(languageServices.workspace, '.likec4-assets')
  // await mkdir(likec4AssetsDir, { recursive: true })

  const server = await viteDev({
    buildWebcomponent: !DEV,
    hmr: true,
    base,
    webcomponentPrefix,
    languageServices,
    useHashHistory,
    useOverviewGraph: useOverview,
    likec4AssetsDir,
  })

  server.config.logger.clearScreen('info')
  printServerUrls(server)

  if (!useOverview) {
    return
  }
  const views = await languageServices.diagrams()

  if (hasAtLeast(views, 1)) {
    const logger = createLikeC4Logger('c4:export')
    const serverUrl = resolveServerUrl(server)
    if (!serverUrl) {
      logger.error('no preview server url')
      return
    }
    logger.info(k.cyan(`wait 5sec before generating previews`))
    await delay(5000)

    try {
      await exportViewsToPNG({
        serverUrl,
        logger,
        views,
        theme: 'light',
        output: likec4AssetsDir,
        outputType: 'flat',
      })

      await delay(1000)

      logger.info(k.yellow(`Note: changes in sources do not trigger preview updates, restart is required`))
    } catch (error) {
      logger.error(k.red('Failed to generate previews'))
      logger.error(error)
    }
  } else {
    server.config.logger.warn('no views found, no previews generated')
  }
}
