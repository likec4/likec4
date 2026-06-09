// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

type ViewportTransform = {
  raw: string
  scale: number
  x: number
  y: number
}

async function viewportTransform(page: Page): Promise<ViewportTransform> {
  return page.locator('.react-flow__viewport').first().evaluate((element) => {
    const raw = window.getComputedStyle(element).transform
    const matrix = new DOMMatrixReadOnly(raw)
    return {
      raw,
      scale: matrix.a,
      x: matrix.e,
      y: matrix.f,
    }
  })
}

function isSameViewportTransform(actual: ViewportTransform, expected: ViewportTransform): boolean {
  return Math.abs(actual.scale - expected.scale) <= 0.001
    && Math.abs(actual.x - expected.x) <= 1
    && Math.abs(actual.y - expected.y) <= 1
}

test('diagram supports keyboard zoom shortcuts (#2915)', async ({ page }) => {
  await page.goto('/project/e2e/view/index/')
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  const diagram = page.locator('.react-flow').first()
  await diagram.focus()
  await expect(diagram).toBeFocused()

  const before = await viewportTransform(page)
  await page.keyboard.press('Control+Equal')
  await expect.poll(async () => (await viewportTransform(page)).raw).not.toBe(before.raw)

  const afterZoomIn = await viewportTransform(page)
  await page.keyboard.press('Control+-')
  await expect.poll(async () => (await viewportTransform(page)).raw).not.toBe(afterZoomIn.raw)

  await page.keyboard.press('Control+-')
  await expect.poll(async () => (await viewportTransform(page)).raw).not.toBe(before.raw)

  const afterZoomOut = await viewportTransform(page)
  await page.keyboard.press('Control+0')
  await expect.poll(async () => (await viewportTransform(page)).raw).not.toBe(afterZoomOut.raw)
  await expect.poll(async () => isSameViewportTransform(await viewportTransform(page), before)).toBe(true)
})
