/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'playwright-core'
import type { Logger } from 'vite'
import { resolve } from 'node:path'
import type { DiagramView } from '@likec4/core'
import k from 'picocolors'

type TakeScreenshotParams = {
  browser: Browser
  pageUrl: (view: DiagramView) => string
  outputDir: string
  logger: Logger
}

export function mkTakeScreenshotFn({ browser, pageUrl, outputDir, logger }: TakeScreenshotParams) {
  return async function takeScreenshot(view: DiagramView) {
    const padding = 20
    const url = pageUrl(view) + `&padding=${padding}`
    logger.info(`${k.dim('export')} ${view.id}  ${k.dim(url)}`)

    const page = await browser.newPage({
      viewport: {
        width: view.width + padding * 2,
        height: view.height + padding * 2
      }
    })

    try {
      await page.goto(url)
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        logger.error(`Timeout while loading page: ${url}`)
      } else {
        logger.error(`Page loading failed: ${url}\n${error}`, { error: error as any })
      }
      await page.close()
      return
    }

    try {
      await Promise.all([page.waitForLoadState('load')])
    } catch (error: unknown) {
      logger.error(`Timeout while waiting for page load state: ${url}\n${error}`, {
        error: error as any
      })
      await page.close()
      return
    }

    const path = resolve(outputDir, view.relativePath ?? '.', `${view.id}.png`)

    try {
      await page.screenshot({
        scale: 'css',
        path,
        animations: 'disabled',
        omitBackground: true
      })
    } catch (error: unknown) {
      logger.error(`Error when taking screenshot: ${url}\n${error}`, { error: error as any })
      await page.close()
      return
    }
  }
}
