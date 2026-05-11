/// <reference lib="DOM" />
// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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
  format?: 'png' | 'jpeg'
  quality?: number | undefined
  notation?: boolean
}

/**
 * Builds the SPA export URL for a view screenshot, encoding the view id and export query parameters.
 *
 * @param params - View id, padding, theme, and optional dynamic layout, image format, and notation settings.
 * @returns Relative URL containing `padding`, `theme`, optional `dynamic`, `format`, and `notation` query parameters.
 */
export function createExportViewUrl({
  viewId,
  padding,
  theme,
  dynamicVariant,
  format = 'png',
  notation = false,
}: {
  viewId: string
  padding: number
  theme: 'light' | 'dark'
  dynamicVariant?: DynamicViewDisplayVariant | undefined
  format?: 'png' | 'jpeg'
  notation?: boolean
}): string {
  return withQuery(`export/${encodeURIComponent(viewId)}/`, {
    padding,
    theme,
    dynamic: dynamicVariant,
    ...(notation ? { notation: true } : {}),
    ...(format === 'jpeg' ? { format: 'jpeg' } : {}),
  })
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
  format = 'png',
  quality,
  notation = false,
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
      const fileExt = format === 'jpeg' ? '.jpg' : '.png'
      const path = resolve(output, relativePath, `${view.id}${fileExt}`)

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
      await page.goto(createExportViewUrl({
        viewId: view.id,
        padding,
        theme,
        dynamicVariant,
        format,
        notation,
      }))

      logger.info(k.cyan(url) + k.dim(` -> ${relative(output, path)}`))

      await page.waitForSelector('.react-flow.initialized')
      const exportPage = page.getByTestId('export-page')
      const exportBox = await exportPage.boundingBox()
      if (exportBox) {
        const width = Math.ceil(exportBox.width)
        const height = Math.ceil(exportBox.height)
        const viewport = page.viewportSize()
        if (!viewport || width > viewport.width || height > viewport.height) {
          await page.setViewportSize({ width, height })
        }
      }

      const hasImages = view.nodes.some(n => isTruthy(n.icon) && n.icon.toLowerCase().startsWith('http'))
      if (hasImages) {
        await waitAllImages(page, timeout)
      }

      await exportPage.screenshot({
        animations: 'disabled',
        path,
        type: format === 'jpeg' ? 'jpeg' : 'png',
        ...(format === 'jpeg'
          ? { quality: quality ?? 80, omitBackground: false }
          : { omitBackground: true }),
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
