import { exportViewsToPNG } from '@/cli/export/png/handler'
import { LanguageServices } from '@/language-services'
import { createLikeC4Logger } from '@/logger'
import { printServerUrls, resolveServerUrl } from '@/vite/printServerUrls'
import { viteDev } from '@/vite/vite-dev'
import { delay } from '@likec4/core'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'

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
  base
}: HandlerParams) {
  const languageServices = await LanguageServices.get({ path, useDotBin })
  const likec4AssetsDir = await mkdtemp(join(tmpdir(), '.likec4-assets-'))
  // const likec4AssetsDir = join(languageServices.workspace, '.likec4-assets')
  // await mkdir(likec4AssetsDir, { recursive: true })

  const server = await viteDev({
    buildWebcomponent: false,
    hmr: true,
    base,
    webcomponentPrefix,
    languageServices,
    useHashHistory,
    useOverviewGraph: useOverview,
    likec4AssetsDir
  })

  server.config.logger.clearScreen('info')
  printServerUrls(server)

  if (!useOverview) {
    return
  }
  const views = await languageServices.views.diagrams()

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
        outputType: 'flat'
      })

      logger.warn(k.cyan(`Previews are not updated automatically, restart is required`))
    } catch (error) {
      logger.error(k.red('Failed to generate previews'))
      logger.error(error)
    }
  } else {
    server.config.logger.warn('no views found, no previews generated')
  }
}
