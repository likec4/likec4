/* eslint-disable @typescript-eslint/no-explicit-any */
import { hasAtLeast } from '@likec4/core'
import { hrtime } from 'node:process'
import k from 'picocolors'
import { chromium } from 'playwright'
import { LanguageServices } from '../../../language-services'
import { createLikeC4Logger, inMillis, startTimer } from '../../../logger'
import { viteDev } from '../../../vite/vite-dev'
import { takeScreenshot } from './takeScreenshot'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output: string
  theme: 'light' | 'dark'
  useDotBin: boolean
  timeoutMs: number
  maxAttempts: number
  ignore: boolean
}

export async function pngHandler({ path, useDotBin, theme, output, ignore, timeoutMs, maxAttempts }: HandlerParams) {
  const logger = createLikeC4Logger('c4:export')
  const timer = startTimer()

  const languageServices = await LanguageServices.get({ path, useDotBin })

  const views = await languageServices.views.diagrams()
  if (!hasAtLeast(views, 1)) {
    logger.warn('no views found')
    throw new Error('no views found')
  }

  logger.info(k.cyan(`start preview server`))
  const server = await viteDev({
    languageServices,
    buildWebcomponent: false,
    openBrowser: false,
    hmr: false
  })
  if (!server.resolvedUrls) {
    throw new Error('Vite server is not ready, no resolvedUrls')
  }
  const hosts = [...server.resolvedUrls.network, ...server.resolvedUrls.local]
  if (!hasAtLeast(hosts, 1)) {
    logger.error(`no preview server url`)
    throw new Error(`no preview server url`)
  }
  logger.info(`${k.dim('output')} ${output}`)

  logger.info(k.cyan(`start chromium, colorScheme: ${theme}`))
  const baseURL = hosts[0]
  const browser = await chromium.launch()
  const browserContext = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: theme,
    baseURL,
    isMobile: false
  })
  browserContext.setDefaultNavigationTimeout(timeoutMs)
  browserContext.setDefaultTimeout(timeoutMs)

  logger.info(`${k.cyan('baseURL')} ${k.dim(baseURL)}`)

  const startTakeScreenshot = hrtime()

  const succeed = await takeScreenshot({
    browserContext,
    views,
    output,
    logger,
    maxAttempts,
    timeout: timeoutMs,
    theme
  })

  const { pretty } = inMillis(startTakeScreenshot)

  try {
    logger.info(k.cyan(`close chromium`))
    await browserContext.close()
    await browser.close()

    logger.info(k.cyan(`stop preview server`))
    await server.close()
  } finally {
  }

  if (succeed.length > 0) {
    logger.info(k.green(`exported ${succeed.length} views in ${pretty}`))
  }
  if (succeed.length !== views.length) {
    if (ignore === true && succeed.length > 0) {
      logger.info(k.dim('ignore') + ' ' + k.red(`failed ${views.length - succeed.length} out of ${views.length} views`))
    } else {
      logger.error(k.red(`failed ${views.length - succeed.length} out of ${views.length} views`))
    }
  }

  if (succeed.length !== views.length && (succeed.length === 0 || ignore !== true)) {
    throw new Error(`Failed ${views.length - succeed.length} out of ${views.length} views`)
  }

  timer.stopAndLog(`✓ export in `)
}
