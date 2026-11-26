// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type Page, expect, test } from '@playwright/test'

/**
 * Input of the workspace search overlay
 */
function searchInput(page: Page) {
  return page.getByRole('textbox', { name: 'Search', exact: true })
}

/**
 * Limits the search to the `export-config` project and clicks its "Landscape view".
 * Every project of the e2e workspace has a view with this title.
 */
async function pickLandscapeView(page: Page) {
  await page.getByRole('group', { name: 'Limit to project' }).getByRole('button', { name: /^export-config/ }).click()
  await page.getByRole('button', { name: /Landscape view/ }).click()
}

/**
 * E2E tests for the overview page header features:
 * search bar, sidebar navigation drawer, theme toggle, and logo.
 *
 * Runs against `likec4 start` (port 5173) via the main Playwright config.
 */

test.describe('Overview page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to single-project overview (/ may redirect to /projects/ in multi-project E2E workspace)
    await page.goto('/single-index/')
    // Wait for the page to be interactive (view cards rendered)
    await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible()
  })

  test('header shows burger, logo, search bar, and theme toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Search/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Toggle color scheme' })).toBeVisible()
  })

  test('clicking search bar opens search overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    // Search overlay should show the input
    await expect(searchInput(page)).toBeVisible()
  })

  test('Ctrl+K opens search overlay', async ({ page }) => {
    await page.keyboard.press('Control+k')
    await expect(searchInput(page)).toBeVisible()
  })

  test('search input accepts text', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    const input = searchInput(page)
    await input.fill('cloud')
    await expect(input).toHaveValue('cloud')
  })

  test('Escape closes search overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    await expect(searchInput(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(searchInput(page)).not.toBeVisible()
  })

  test('burger opens sidebar drawer', async ({ page }) => {
    await page.getByRole('button', { name: 'Toggle navigation' }).click()
    // Drawer should open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('theme toggle switches color scheme', async ({ page }) => {
    // Start in light mode (default per playwright config)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'light')

    await page.getByRole('button', { name: 'Toggle color scheme' }).click()
    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'dark')

    await page.getByRole('button', { name: 'Toggle color scheme' }).click()
    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'light')
  })

  test('clicking a view in search navigates to diagram', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    // Search opens across all projects, limit it to the project of this page
    await pickLandscapeView(page)
    // Multi-project: navigation uses /project/:id/view/... (no bare /view rewrite).
    // /single-index/ is scoped to the first discovered project (export-config in this workspace).
    await expect(page).toHaveURL(/\/project\/export-config\/view\/index\//)
  })

  test('search overlay closes after navigating to a view (#2353)', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: /Search/ }).click()
    await expect(searchInput(page)).toBeVisible()

    // Navigate to a view via the search panel
    await pickLandscapeView(page)
    await expect(page).toHaveURL(/\/project\/export-config\/view\/index\//)

    // The search dialog must be fully gone — no ghost overlay trapping focus
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.locator('[data-likec4-search]')).toHaveCount(0)

    // The diagram view should be interactive (not blocked by overlay)
    await expect(page.locator('.react-flow__pane')).toBeVisible()
  })

  test('bare /view/index/ is not-found on multi-project site', async ({ page }) => {
    await page.goto('/view/index/')
    await expect(page.getByText('Nothing to see here')).toBeVisible()
  })
})
