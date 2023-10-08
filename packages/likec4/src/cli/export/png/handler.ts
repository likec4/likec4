/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramView } from '@likec4/core'
import { rm } from 'fs/promises'
import { availableParallelism } from 'node:os'
import { resolve } from 'node:path'
import PQueue from 'p-queue'
import k from 'picocolors'
import { chromium } from 'playwright-core'
import prettyMilliseconds from 'pretty-ms'
import { LanguageServicesInstance } from '../../../language-services'
import { createLikeC4Logger } from '../../../logger'
import { viteBuild } from '../../../vite/vite-build'
import { vitePreview } from '../../../vite/vite-preview'
import { mkTakeScreenshotFn } from '../utils/takeScreenshot'

const NS_PER_MS = 1e6

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output: string
}

export async function handler({ path, output }: HandlerParams) {
  const start = process.hrtime()
  const languageServices = await LanguageServicesInstance.get({
    workspaceDir: path
  })

  const logger = createLikeC4Logger('c4:export')

  const views = await languageServices.getViews()
  if (views.length === 0) {
    logger.warn('no views found')
    process.exit(0)
  }

  const buildOutputDir = resolve(output, '.build-cache')

  logger.info(`build`)
  await viteBuild({ languageServices, outputDir: buildOutputDir })

  logger.info(`start preview server`)
  const previewServer = await vitePreview({
    languageServices,
    outputDir: buildOutputDir,
    open: false
  })

  const pageUrl = (view: DiagramView) =>
    `http://localhost:${previewServer.config.preview.port}/?export=${encodeURIComponent(view.id)}`

  logger.info(`start chromium`)
  const browser = await chromium.launch()
  const takeScreenshot = mkTakeScreenshotFn({ browser, pageUrl, outputDir: output, logger })

  const concurrency = availableParallelism()
  logger.info(`${k.dim('concurrency')} ${concurrency}`)
  logger.info(`${k.dim('output')} ${output}`)
  const queue = new PQueue({ concurrency })

  try {
    await queue.addAll(
      views.map(v => () => takeScreenshot(v)),
      {
        throwOnTimeout: true,
        timeout: 20000
      }
    )
  } catch (error) {
    logger.error(`Error while taking screenshots`, { error: error as any })
  }
  // delete vite cache
  await rm(buildOutputDir, { recursive: true, force: true })

  logger.info(`close browser`)
  await browser.close()
  logger.info(`stop preview server`)
  await new Promise<void>((resolve, reject) => {
    previewServer.httpServer.close(err => (err ? reject(err) : resolve()))
  })
  const diff = process.hrtime(start)
  logger.info(k.green(`✓ export in ${prettyMilliseconds(diff[0] * 1000 + diff[1] / NS_PER_MS)}`))
}
