/* eslint-disable @typescript-eslint/no-explicit-any */
import { type DiagramView, hasAtLeast } from '@likec4/core'
import { rm } from 'fs/promises'
import { resolve } from 'node:path'
import k from 'picocolors'
import { chromium } from 'playwright-core'
import { LanguageServices } from '../../../language-services'
import { createLikeC4Logger, startTimer } from '../../../logger'
import { viteBuild } from '../../../vite/vite-build'
import { vitePreview } from '../../../vite/vite-preview'
import { mkTakeScreenshotFn } from '../utils/takeScreenshot'

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
  if (views.length === 0) {
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

  const pageUrl = (view: DiagramView) => `${hosts[0]}export/${encodeURIComponent(view.id)}`

  logger.info(k.cyan(`start chromium`))

  const browser = await chromium.launch()
  const page = await browser.newPage({
    deviceScaleFactor: 2
  })

  const takeScreenshot = mkTakeScreenshotFn({ page, pageUrl, outputDir: output, logger })
  for (const view of views) {
    await takeScreenshot(view)
  }
  await page.close()
  // const concurrency = Math.max(availableParallelism() - 1, 1)
  // logger.info(`${k.dim('concurrency')} ${concurrency}`)
  // logger.info(`${k.dim('output')} ${output}`)
  // const queue = new PQueue({ concurrency })

  // await queue.addAll(
  //   views.map(v => () => takeScreenshot(v)),
  //   {
  //     throwOnTimeout: true,
  //     timeout: 60000
  //   }
  // )

  // delete vite cache
  logger.info(k.dim('clean build outDir'))
  await rm(buildOutputDir, { recursive: true, force: true })

  logger.info(k.cyan(`close chromium`))
  await browser.close()
  logger.info(k.cyan(`stop preview server`))
  await new Promise<void>((resolve, reject) => {
    previewServer.httpServer.close(err => (err ? reject(err) : resolve()))
  })
  timer.stopAndLog(`✓ export in `)
}
