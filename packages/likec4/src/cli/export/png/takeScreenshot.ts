/// <reference lib="DOM" />
import type { DiagramView, DynamicViewDisplayVariant, NonEmptyArray } from '@likec4/core'
import { relative, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import type { BrowserContext, Page } from 'playwright'
import { clamp, isTruthy } from 'remeda'
import k from 'tinyrainbow'
import { withQuery } from 'ufo'
import type { ViteLogger } from '../../../logger'

type TakeScreenshotParams = {
  browserContext: BrowserContext
  views: NonEmptyArray<DiagramView>
  output: string
  logger: ViteLogger
  timeout: number
  maxAttempts: number
  dynamicVariant?: DynamicViewDisplayVariant
  outputType: 'relative' | 'flat'
  theme: 'light' | 'dark'
}

/**
 * Capture each view as PNG under the output directory using the provided browser context.
 * @param params - Configuration object containing browser context, views, output path, logger, timeout, and rendering options.
 * @returns Promise resolving to an array of successfully captured views with their file paths.
 */
export async function takeScreenshot({
  browserContext,
  views,
  output,
  logger,
  timeout,
  maxAttempts,
  dynamicVariant,
  outputType,
  theme,
}: TakeScreenshotParams) {
  const padding = 20

  let page: Page | undefined

  const pending = views.map(view => ({ view, attempt: 1 }))
  const succeed = [] as Array<{ view: DiagramView; path: string }>

  let next
  while ((next = pending.shift())) {
    const { view, attempt } = next
    const url = `export/${encodeURIComponent(view.id)}/`
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
        if (view.hasLayoutDrift) {
          logger.warn(
            k.yellow('Drift detected, manual layout can not be applied, view may be invalid: ') + k.red(view.id),
          )
        }
      }

      let relativePath = '.'
      if (outputType === 'relative') {
        relativePath = view.sourcePath ?? '.'
        if (relativePath.includes('/')) {
          relativePath = relativePath.slice(0, relativePath.lastIndexOf('/'))
        } else {
          relativePath = '.'
        }
      }
      const path = resolve(output, relativePath, `${view.id}.png`)

      page ??= await browserContext.newPage()

      let bounds = view.bounds
      if (dynamicVariant === 'sequence' && view._type === 'dynamic') {
        bounds = view.sequenceLayout.bounds
      }

      // @see https://github.com/likec4/likec4/issues/1857
      const extraPadding = 20
      await page.setViewportSize({
        width: bounds.width + padding * 2 + extraPadding,
        height: bounds.height + padding * 2 + extraPadding,
      })
      await page.goto(withQuery(url, {
        padding,
        theme,
        dynamic: dynamicVariant,
      }))

      logger.info(k.cyan(url) + k.dim(` -> ${relative(output, path)}`))

      await page.waitForSelector('.react-flow.initialized')

      const hasImages = view.nodes.some(n => isTruthy(n.icon) && n.icon.toLowerCase().startsWith('http'))
      if (hasImages) {
        await waitAllImages(page, timeout)
      }

      await page.getByTestId('export-page').screenshot({
        animations: 'disabled',
        path,
        omitBackground: true,
      })

      succeed.push({ view, path })
    } catch (error) {
      // Force close page, we want fresh page for each attempt
      // With runBeforeUnload doesn't wait for page to be closed
      page?.close({ runBeforeUnload: true }).catch(e => logger.error(`failed to close page: ${e}`))

      logger.error(k.red('failed ' + url + '\n' + error))
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
        image.complete || new Promise(resolve => {
          image.onload = resolve
          image.onerror = resolve
        }),
      { timeout: Math.max(15_000, timeout) }, // wait at least 15s to load image
    )
  )
  // Wait for all once
  await Promise.allSettled(promises)
}
