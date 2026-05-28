// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

const PROJECT = 'e2e'
const VIEW = 'index'

function exportUrl(viewId: string): string {
  return `/project/${encodeURIComponent(PROJECT)}/export/${encodeURIComponent(viewId)}/?padding=22`
}

function viewUrl(viewId: string): string {
  return `/project/${encodeURIComponent(PROJECT)}/view/${encodeURIComponent(viewId)}/`
}

test.describe('Diagram accessibility (#2988)', () => {
  test('exposes LikeC4 node and relationship text to the accessibility tree', async ({ page }) => {
    await page.goto(exportUrl(VIEW))
    await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

    const customer = page.locator('.react-flow__node[data-id="customer"]')
    await expect(customer).toHaveAttribute('tabindex', '0')
    await expect(customer).toHaveAttribute('aria-label', /Cloud System Customer/)
    await expect(customer).toHaveAttribute('aria-label', /The regular customer/)

    // The composed aria-label is the single source of the node's text. The
    // decorative shape/icon and the visible title/description are hidden from
    // assistive tech, so they must not reappear as separate nodes in the tree
    // (otherwise a screen reader announces the text twice). This is the export
    // view, so the node has no interactive action buttons — keyboard reach of
    // those buttons is covered by the activation tests below.
    const customerTree = await customer.ariaSnapshot()
    expect(customerTree).not.toMatch(/^\s*- text:/m)
    expect(customerTree).not.toMatch(/^\s*- paragraph:/m)

    const relationship = page.locator('.react-flow__edge[data-id="kzb1r3"]')
    await expect(relationship).toHaveAttribute('tabindex', '0')
    await expect(relationship).toHaveAttribute('aria-label', /Relationship from/)
    await expect(relationship).toHaveAttribute('aria-label', /Cloud System Customer/)

    const snapshot = await canvas(page).ariaSnapshot()
    await test.info().attach('diagram-a11y-snapshot', {
      body: snapshot,
      contentType: 'text/yaml',
    })
    expect(snapshot).toContain('Cloud System Customer')
    expect(snapshot).toContain('Relationship from')
  })

  for (const key of ['Enter', 'Space']) {
    test(`activates a focused relationship with ${key}`, async ({ page }) => {
      await page.goto(viewUrl(VIEW))
      await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

      const relationship = page.locator('.react-flow__edge[data-id="kzb1r3"]')
      await relationship.focus()
      await page.keyboard.press(key)

      await expect(page.getByText('DIRECT RELATIONSHIPS')).toBeVisible()
    })
  }

  for (const key of ['Enter', 'Space']) {
    test(`navigates from a focused node action with ${key}`, async ({ page }) => {
      await page.goto(viewUrl(VIEW))
      await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

      const cloud = page.locator('.react-flow__node[data-id="cloud"]')
      await cloud.focus()
      await page.keyboard.press(key)

      const navigateButton = cloud.getByRole('button', { name: 'Navigate to view' })
      await expect(navigateButton).toBeVisible()
      await page.keyboard.press('Tab')
      await expect(navigateButton).toBeFocused()
      await page.keyboard.press(key)

      await expect(page).toHaveURL(/\/project\/e2e\/view\/cloud\//)
      await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
    })
  }
})
