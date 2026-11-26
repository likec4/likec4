// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

const PROJECT = 'e2e'
const VIEW = 'index'
const RELATIONSHIP_LABEL = '.likec4-edge-label[data-edge-id]'
const RELATIONSHIP_POPOVER_TEXT = 'DIRECT RELATIONSHIPS'

function embedUrl(viewId: string): string {
  return `/project/${encodeURIComponent(PROJECT)}/embed/${encodeURIComponent(viewId)}/`
}

test('static build embed pages show relationship popup on edge hover (#2962)', async ({ page }) => {
  await page.goto(embedUrl(VIEW))
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  const relationship = page.locator(RELATIONSHIP_LABEL).filter({ hasText: /uses/i }).first()
  await expect(relationship).toBeVisible()
  await relationship.hover()

  await expect(page.getByText(RELATIONSHIP_POPOVER_TEXT)).toBeVisible()
  await expect(page.getByRole('button', { name: /^browse relationships$/i })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^browse relationships$/i })).toBeVisible()
})

test('relationship popup shows relationship tags (#3255)', async ({ page }) => {
  await page.goto(embedUrl(VIEW))
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  await page.locator(RELATIONSHIP_LABEL).filter({ hasText: 'uses and pays' }).first().hover()

  const popover = page.locator('.nowheel').filter({ hasText: RELATIONSHIP_POPOVER_TEXT })
  await expect(popover).toBeVisible()
  await expect(popover.locator('[data-likec4-tag="api"]')).toBeVisible()
})

test('relationship metadata is readable above the canvas popover', async ({ page }) => {
  await page.goto('/project/e2e/view/customer/')
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  await page.locator(RELATIONSHIP_LABEL).filter({ hasText: 'helps with questions' }).hover()
  const popover = page.locator('.nowheel').filter({ hasText: RELATIONSHIP_POPOVER_TEXT })
  await popover.locator('.tabler-icon-info-circle').hover()

  const key = page.getByRole('tooltip').getByText('rps:')
  await expect(key).toBeVisible()
  // Include the otherwise pointer-transparent tooltip in the browser's hit test.
  await page.addStyleTag({ content: '[role="tooltip"] { pointer-events: auto }' })
  await expect.poll(() =>
    key.evaluate(el => {
      const { x, y, height } = el.getBoundingClientRect()
      return el.contains(document.elementFromPoint(x + 1, y + height / 2))
    })
  ).toBe(true)
})
