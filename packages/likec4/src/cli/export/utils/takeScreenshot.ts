/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramView } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'picocolors'
import type { Browser, Page } from 'playwright-core'
import type { Logger } from 'vite'

type TakeScreenshotParams = {
  page: Page
  pageUrl: (view: DiagramView) => string
  outputDir: string
  logger: Logger
}

export function mkTakeScreenshotFn({ page, pageUrl, outputDir, logger }: TakeScreenshotParams) {
  return async function takeScreenshot(view: DiagramView) {
    const padding = 24
    const url = pageUrl(view)
    logger.info(`${k.cyan('export')} ${view.id} ${k.underline(k.dim(url))}`)

    try {
      await page.setViewportSize({
        width: view.width + padding * 2 + 4,
        height: view.height + padding * 2 + 4
      })
    } catch (error: unknown) {
      logger.error(`Failed setViewportSize: ${url}\n${error}`, {
        error: error as any
      })
      return
    }

    try {
      await page.goto(url, {
        timeout: 8000
      })
      await page.waitForSelector('.transparent-bg', { timeout: 2000 })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        logger.error(`Timeout while loading page: ${url}`)
      } else {
        logger.error(`Page loading failed: ${url}\n${error}`, { error: error as any })
      }
      return
    }

    try {
      // Wait for network to be idle (if there images to be loaded)
      await page.waitForLoadState('networkidle', { timeout: 15000 })
    } catch (error: unknown) {
      logger.error(`Timeout while waiting for page load state: ${url}\n${error}`, {
        error: error as any
      })
      return
    }

    const path = resolve(outputDir, view.relativePath ?? '.', `${view.id}.png`)

    try {
      await page.screenshot({
        path,
        animations: 'disabled',
        timeout: 15000,
        omitBackground: true
      })
    } catch (error: unknown) {
      logger.error(`Error when taking screenshot: ${url}\n${error}`, { error: error as any })
      return
    }
  }
}
