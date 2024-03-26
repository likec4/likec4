/// <reference lib="DOM" />
import type { DiagramView, NonEmptyArray } from '@likec4/core'
import { resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import k from 'picocolors'
import type { BrowserContext, Page } from 'playwright'
import { clamp, isString } from 'remeda'
import type { Logger } from 'vite'

type TakeScreenshotParams = {
  browserContext: BrowserContext
  views: NonEmptyArray<DiagramView>
  output: string
  logger: Logger
  timeout: number
  maxAttempts?: number
}

export async function takeScreenshot(
  { browserContext, views, output, logger, timeout, maxAttempts = 4 }: TakeScreenshotParams
) {
  const padding = 20

  let page: Page | undefined

  const pending = views.map(view => ({ view, attempt: 1 }))
  const succeed = [] as Array<{ view: DiagramView; path: string }>

  let next
  while ((next = pending.shift())) {
    const { view, attempt } = next
    const url = `/export/${encodeURIComponent(view.id)}`
    try {
      if (attempt > 1) {
        if (page) {
          // New page for each attempt
          // with runBeforeUnload doesn't wait for page to be closed
          page.close({ runBeforeUnload: true }).catch(e => logger.error(`failed to close page: ${e}`))
          page = undefined
        }
        const sleepMs = clamp(attempt * 200, { min: 200, max: 1000 })
        logger.info(k.cyan(url) + k.dim(` attempt ${attempt} of ${maxAttempts} after ${sleepMs}ms`))
        await sleep(sleepMs)
      } else {
        logger.info(k.cyan(url))
      }

      page ??= await browserContext.newPage()

      await page.setViewportSize({
        width: view.width + padding * 2 + 4,
        height: view.height + padding * 2 + 4
      })

      await page.goto(url)

      await page.waitForSelector('.transparent-bg')

      const hasImages = view.nodes.some(n => isString(n.icon))
      if (hasImages) {
        await waitAllImages(page, timeout)
      }

      const path = resolve(output, view.relativePath ?? '.', `${view.id}.png`)
      await page.screenshot({
        path,
        animations: 'disabled',
        omitBackground: true
      })

      succeed.push({ view, path })
    } catch (error) {
      // Force close page, we want fresh page for each attempt
      // With runBeforeUnload doesn't wait for page to be closed
      page?.close({ runBeforeUnload: true }).catch(e => logger.error(`failed to close page: ${e}`))

      logger.error(`${k.red('failed ' + url)}\n${error}`)
      if (attempt < maxAttempts) {
        pending.push({ view, attempt: attempt + 1 })
        logger.info(k.dim(`retry ${url}`))
      }
      page = undefined
    }
  }

  return succeed
}

/**
 * https://stackoverflow.com/questions/77287441/how-to-wait-for-full-rendered-image-in-playwright
 */
async function waitAllImages(page: Page, timeout: number) {
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
      { timeout: Math.max(30_000, timeout) } // wait at least 30s to load image
    )
  )
  // Wait for all once
  await Promise.allSettled(promises)
}
