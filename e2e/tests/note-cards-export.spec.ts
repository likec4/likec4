// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'

const exportUrl = (format: 'png' | 'jpeg') =>
  `/project/e2e/export/note-cards-export/?padding=22${format === 'jpeg' ? '&format=jpeg' : ''}`

for (const format of ['png', 'jpeg'] as const) {
  test(`${format.toUpperCase()} export contains the measured element and relationship note cards`, async ({ page }) => {
    await page.goto(exportUrl(format))

    const exportPage = page.getByTestId('export-page')
    await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')

    const cards = page.locator('[data-likec4-note-card]')
    const leaders = page.locator('[data-likec4-note-leaders] g[data-note-target]')
    await expect(cards).toHaveCount(2)
    await expect(leaders).toHaveCount(2)
    await expect(cards.filter({ hasText: 'This long element note' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'This relationship note' })).toHaveCount(1)

    const noteImage = cards.locator('img')
    await expect(noteImage).toHaveCount(1)
    expect(await noteImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)

    const exportBox = await exportPage.boundingBox()
    expect(exportBox).not.toBeNull()
    if (!exportBox) return
    const viewport = page.viewportSize()
    if (!viewport || exportBox.width > viewport.width || exportBox.height > viewport.height) {
      await page.setViewportSize({ width: Math.ceil(exportBox.width), height: Math.ceil(exportBox.height) })
      await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')
    }

    const diagramArea = await page.getByTestId('export-diagram-area').boundingBox()
    expect(diagramArea).not.toBeNull()
    if (!diagramArea) return

    for (const item of [cards.nth(0), cards.nth(1), leaders.nth(0), leaders.nth(1)]) {
      const box = await item.boundingBox()
      expect(box).not.toBeNull()
      if (!box) continue
      expect(box.x).toBeGreaterThanOrEqual(diagramArea.x - 1)
      expect(box.y).toBeGreaterThanOrEqual(diagramArea.y - 1)
      expect(box.x + box.width).toBeLessThanOrEqual(diagramArea.x + diagramArea.width + 1)
      expect(box.y + box.height).toBeLessThanOrEqual(diagramArea.y + diagramArea.height + 1)
    }

    const screenshot = await exportPage.screenshot({ type: format, scale: 'css' })
    const imageSize = await page.evaluate(async ({ base64, mime }) => {
      const image = new Image()
      image.src = `data:${mime};base64,${base64}`
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    }, {
      base64: screenshot.toString('base64'),
      mime: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    })
    expect(imageSize.width).toBeGreaterThanOrEqual(Math.floor(exportBox.width))
    expect(imageSize.height).toBeGreaterThanOrEqual(Math.floor(exportBox.height))
  })
}
