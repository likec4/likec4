/// <reference lib="DOM" />
// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DiagramView, DynamicViewDisplayVariant } from '@likec4/core'
import type { Page } from 'playwright'
import { resolve } from 'node:path'
import { isTruthy } from 'remeda'
import { withQuery } from 'ufo'

/** Corner of the exported image the notation panel is aligned to; must match the export page in `@likec4/spa`. */
export const NotationPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
export type NotationPosition = typeof NotationPositions[number]
export const DEFAULT_NOTATION_POSITION: NotationPosition = 'bottom-right'

/** How notation entries are labelled; must match the export page in `@likec4/spa`. */
export const NotationTexts = ['short', 'full', 'kind'] as const
export type NotationText = typeof NotationTexts[number]
export const DEFAULT_NOTATION_TEXT: NotationText = 'short'

/**
 * Builds the SPA export URL for a view screenshot, encoding the view id and export query parameters.
 *
 * @param params - View id, padding, theme, and optional dynamic layout, image format, notation, and description settings.
 * @returns Relative URL containing `padding`, `theme`, optional `dynamic`, `format`, `notation`
 *   (with non-default `notationPosition` and `notationText`), and `description`.
 */
export function createExportViewUrl({
  viewId,
  padding,
  theme,
  dynamicVariant,
  format = 'png',
  notation = false,
  notationPosition = DEFAULT_NOTATION_POSITION,
  notationText = DEFAULT_NOTATION_TEXT,
  description = false,
}: {
  viewId: string
  padding: number
  theme: 'light' | 'dark'
  dynamicVariant?: DynamicViewDisplayVariant | undefined
  format?: 'png' | 'jpeg'
  notation?: boolean
  notationPosition?: NotationPosition | undefined
  notationText?: NotationText | undefined
  description?: boolean
}): string {
  return withQuery(`export/${encodeURIComponent(viewId)}/`, {
    padding,
    theme,
    dynamic: dynamicVariant,
    ...(notation ? { notation: true } : {}),
    ...(notation && notationPosition !== DEFAULT_NOTATION_POSITION ? { notationPosition } : {}),
    ...(notation && notationText !== DEFAULT_NOTATION_TEXT ? { notationText } : {}),
    ...(description ? { description: true } : {}),
    ...(format === 'jpeg' ? { format: 'jpeg' } : {}),
  })
}

/** Padding around the diagram on the export page, in pixels. */
export const EXPORT_PADDING = 20

/** One view to capture: absolute URL of the export page and the file to write. */
export type ScreenshotTask = {
  view: DiagramView
  /** Absolute URL of the export page of the view. */
  url: string
  /** Absolute path of the image file. */
  path: string
}

export type CaptureViewOptions = {
  timeout: number
  dynamicVariant?: DynamicViewDisplayVariant | undefined
  format?: 'png' | 'jpeg'
  quality?: number | undefined
}

/**
 * Resolves the image file of a view under the output directory.
 * With `relative` output type the directory structure of the sources is kept.
 */
export function resolveScreenshotPath({
  view,
  output,
  outputType,
  format = 'png',
}: {
  view: DiagramView
  output: string
  outputType: 'relative' | 'flat'
  format?: 'png' | 'jpeg' | undefined
}): string {
  let relativePath = '.'
  if (outputType === 'relative') {
    const sourcePath = view.sourcePath ?? '.'
    relativePath = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '.'
  }
  const fileExt = format === 'jpeg' ? '.jpg' : '.png'
  return resolve(output, relativePath, `${view.id}${fileExt}`)
}

/**
 * Opens the export page of a view on the given page and saves its screenshot to `task.path`.
 * Throws if the page fails to load or render; the caller decides whether to retry.
 */
export async function captureView(
  page: Page,
  task: ScreenshotTask,
  {
    timeout,
    dynamicVariant,
    format = 'png',
    quality,
  }: CaptureViewOptions,
): Promise<void> {
  const { view } = task

  let bounds = view.bounds
  if (dynamicVariant === 'sequence' && view._type === 'dynamic') {
    bounds = view.sequenceLayout.bounds
  }

  // @see https://github.com/likec4/likec4/issues/1857
  const extraPadding = 20
  await page.setViewportSize({
    width: bounds.width + EXPORT_PADDING * 2 + extraPadding,
    height: bounds.height + EXPORT_PADDING * 2 + extraPadding,
  })
  await page.goto(task.url)

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
    path: task.path,
    type: format === 'jpeg' ? 'jpeg' : 'png',
    ...(format === 'jpeg'
      ? { quality: quality ?? 80, omitBackground: false }
      : { omitBackground: true }),
  })
}

/**
 * Waits for images in the export page to either load or fail before the screenshot is captured.
 *
 * Based on https://stackoverflow.com/questions/77287441/how-to-wait-for-full-rendered-image-in-playwright.
 */
async function waitAllImages(page: Page, timeout: number) {
  // Trigger loading of all images
  let locators = await page.locator('//img').all()
  if (!locators.length) return
  // Set up listeners concurrently
  const promises = locators.map(locator =>
    locator.evaluate<unknown, undefined, HTMLImageElement>(
      image =>
        image.complete || new Promise(resolve => {
          image.onload = resolve
          image.onerror = resolve
        }),
      undefined,
      { timeout: Math.max(15_000, timeout) }, // wait at least 15s to load image
    )
  )
  // Wait for all once
  await Promise.allSettled(promises)
}
