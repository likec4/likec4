/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveServerUrl } from '@/vite/printServerUrls'
import { type DiagramView, hasAtLeast, type NonEmptyArray } from '@likec4/core'
import { hrtime } from 'node:process'
import { chromium } from 'playwright'
import k from 'tinyrainbow'
import type { ViteDevServer } from 'vite'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, inMillis, type Logger, type ViteLogger } from '../../../logger'
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
  output: string | undefined
  /**
   * If 'relative' png are exported keeping the same directory structure as source files.
   */
  outputType: 'relative' | 'flat'
  /**
   * If there is a server already running,
   * use this served url instead of starting a new server.
   */
  serverUrl?: string | undefined
  theme?: 'light' | 'dark'
  useDotBin: boolean
  timeoutMs?: number
  maxAttempts?: number
  ignore?: boolean
}

export async function exportViewsToPNG(
  {
    logger,
    serverUrl,
    theme = 'light',
    timeoutMs = 15_000,
    views,
    output,
    outputType = 'relative',
    maxAttempts = 3
  }: {
    logger: ViteLogger
    serverUrl: string
    theme?: 'light' | 'dark'
    timeoutMs?: number
    views: NonEmptyArray<DiagramView>
    output: string
    outputType?: 'relative' | 'flat'
    maxAttempts?: number
  }
) {
  logger.info(`${k.cyan('export output')} ${k.dim(output)}`)
  logger.info(`${k.cyan('from server')} ${k.dim(serverUrl)}`)

  const chromePath = chromium.executablePath()
  logger.info(k.cyan('Start chromium'))
  logger.info(k.dim(chromePath))
  const browser = await chromium.launch()
  logger.info(k.cyan(`Color scheme: `) + theme)
  const browserContext = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: theme,
    baseURL: serverUrl,
    isMobile: false
  })
  browserContext.setDefaultNavigationTimeout(timeoutMs)
  browserContext.setDefaultTimeout(timeoutMs)
  try {
    return await takeScreenshot({
      browserContext,
      views,
      output,
      outputType,
      logger,
      maxAttempts,
      timeout: timeoutMs,
      theme
    })
  } finally {
    logger.info(k.cyan(`close chromium`))
    await browserContext.close()
    await browser.close()
  }
}

export async function pngHandler({
  path,
  useDotBin,
  theme = 'light',
  output,
  outputType,
  serverUrl,
  ignore = false,
  timeoutMs = 10_000,
  maxAttempts = 3
}: HandlerParams) {
  const logger = createLikeC4Logger('c4:export')
  const startTakeScreenshot = hrtime()

  const languageServices = await LikeC4.initForWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm'
  })

  output ??= languageServices.workspace

  const views = await languageServices.views.diagrams()
  if (!hasAtLeast(views, 1)) {
    logger.warn('no views found')
    throw new Error('no views found')
  }
  let server: ViteDevServer | undefined
  if (!serverUrl) {
    logger.info(k.cyan(`start preview server`))
    server = await viteDev({
      languageServices,
      buildWebcomponent: false,
      openBrowser: false,
      useOverviewGraph: false,
      hmr: false
    })
    serverUrl = resolveServerUrl(server)
    if (!serverUrl) {
      logger.error('Vite server is not ready, no resolvedUrls')
      throw new Error('Vite server is not ready, no resolvedUrls')
    }
  }
  try {
    const succeed = await exportViewsToPNG({
      logger,
      serverUrl,
      theme,
      timeoutMs,
      views,
      output,
      outputType,
      maxAttempts
    })
    const { pretty } = inMillis(startTakeScreenshot)

    if (succeed.length > 0) {
      logger.info(k.green(`exported ${succeed.length} views in ${pretty}`))
    }
    if (succeed.length !== views.length) {
      if (ignore && succeed.length > 0) {
        logger.info(
          k.dim('ignore') + ' ' + k.red(`failed ${views.length - succeed.length} out of ${views.length} views`)
        )
      } else {
        logger.error(k.red(`failed ${views.length - succeed.length} out of ${views.length} views`))
      }
    }

    if (succeed.length !== views.length && (succeed.length === 0 || !ignore)) {
      throw new Error(`Failed ${views.length - succeed.length} out of ${views.length} views`)
    }
  } finally {
    if (server) {
      logger.info(k.cyan(`stop server`))
      await server.close().catch(e => {
        logger.error(e)
      })
    }
  }
}
