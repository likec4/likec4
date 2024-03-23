/// <reference lib="DOM" />
import type { DiagramView, NonEmptyArray } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'picocolors'
import type { BrowserContext, Page } from 'playwright-core'
import { isString } from 'remeda'
import type { Logger } from 'vite'

type TakeScreenshotParams = {
  browserContext: BrowserContext
  views: NonEmptyArray<DiagramView>
  output: string
  logger: Logger
}

export async function takeScreenshot({ browserContext, views, output, logger }: TakeScreenshotParams) {
  const padding = 22

  let page: Page | undefined

  const succeed = [] as Array<{ view: DiagramView; path: string }>

  for (const view of views) {
    try {
      const url = `/export/${encodeURIComponent(view.id)}?padding=${padding}`
      logger.info(k.cyan(url))

      page ??= await browserContext.newPage()

      await page.setViewportSize({
        width: view.width + padding * 2 + 4,
        height: view.height + padding * 2 + 4
      })

      await page.goto(url)

      const hasImages = view.nodes.some(n => isString(n.icon))
      if (hasImages) {
        await waitAllImages(page)
      } else {
        await page.waitForSelector('.transparent-bg')
      }

      const path = resolve(output, view.relativePath ?? '.', `${view.id}.png`)
      await page.screenshot({
        path,
        animations: 'disabled',
        omitBackground: true
      })

      succeed.push({ view, path })
    } catch (error) {
      logger.error(`failed on ${view.id}\n${error}`, { error: error as any })
      // Force to create new page
      page = undefined
    }
  }

  return succeed
}

/**
 * https://stackoverflow.com/questions/77287441/how-to-wait-for-full-rendered-image-in-playwright
 */
async function waitAllImages(page: Page) {
  // Trigger loading of all images
  let locators = await page.locator('//img').all()
  if (!locators.length) return
  // Set up listeners concurrently
  const promises = locators.map(locator =>
    locator.evaluate<unknown, HTMLImageElement>(
      image =>
        image.complete || new Promise((res, rej) => {
          image.onload = res
          image.onerror = rej
        }),
      { timeout: 30_000 } // wait max 30s to load image
    )
  )
  // Wait for all once
  await Promise.allSettled(promises)
}
