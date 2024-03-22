/* eslint-disable @typescript-eslint/no-explicit-any */
import { hasAtLeast } from '@likec4/core'
import { rm } from 'fs/promises'
import { resolve } from 'node:path'
import { hrtime } from 'node:process'
import k from 'picocolors'
import { chromium } from 'playwright-core'
import { LanguageServices } from '../../../language-services'
import { createLikeC4Logger, inMillis, startTimer } from '../../../logger'
import { viteBuild } from '../../../vite/vite-build'
import { vitePreview } from '../../../vite/vite-preview'
import { takeScreenshot } from '../utils/takeScreenshot'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output: string

  useDotBin: boolean
}

export async function handler({ path, useDotBin, output }: HandlerParams) {
  const logger = createLikeC4Logger('c4:export')
  const timer = startTimer(logger)

  const languageServices = await LanguageServices.get({ path, useDotBin })

  const views = await languageServices.views.diagrams()
  if (!hasAtLeast(views, 1)) {
    logger.warn('no views found')
    throw new Error('no views found')
  }

  const buildOutputDir = resolve(output, '.build-cache')
  await viteBuild({ languageServices, outputDir: buildOutputDir })

  logger.info(k.cyan(`start preview server`))
  const previewServer = await vitePreview({
    languageServices,
    outputDir: buildOutputDir,
    open: false
  })
  if (!previewServer.resolvedUrls) {
    throw new Error('Vite server is not ready, no resolvedUrls')
  }
  const hosts = [...previewServer.resolvedUrls.network, ...previewServer.resolvedUrls.local]
  if (!hasAtLeast(hosts, 1)) {
    logger.error(`no preview server url`)
    throw new Error(`no preview server url`)
  }
  logger.info(`${k.dim('output')} ${output}`)

  logger.info(k.cyan(`start chromium`))
  const baseURL = hosts[0]
  const browser = await chromium.launch()
  const browserContext = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    baseURL,
    bypassCSP: true,
    isMobile: false
  })
  browserContext.setDefaultNavigationTimeout(10000)
  browserContext.setDefaultTimeout(5000)

  logger.info(`${k.cyan('baseURL')} ${k.dim(baseURL)}`)

  const startTakeScreenshot = hrtime()

  const succeed = await takeScreenshot({ browserContext, views, output, logger })

  const { pretty } = inMillis(startTakeScreenshot)

  if (succeed.length === views.length) {
    logger.info(k.green(`✓ all ${succeed.length} views in ${pretty}`))
  } else if (succeed.length > 1) {
    logger.info(
      k.green(`exported ${succeed.length}`) + ' '
        + k.magenta(`failed ${views.length - succeed.length}` + ` in ${pretty}`)
    )
  } else {
    logger.error(k.red(`failed to export any view out of ${views.length} (${pretty})`))
  }

  logger.info(k.cyan(`close chromium`))
  await browserContext.close()
  await browser.close()

  // delete vite cache
  logger.info(k.cyan('clean build outDir'))
  await rm(buildOutputDir, { recursive: true, force: true })

  logger.info(k.cyan(`stop preview server`))
  await previewServer.close()
  timer.stopAndLog(`✓ export in `)

  process.exit(0)
}
