// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'

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
    await expect(page.getByRole('textbox', { name: /Search by title/ })).toBeVisible()
  })

  test('Ctrl+K opens search overlay', async ({ page }) => {
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('textbox', { name: /Search by title/ })).toBeVisible()
  })

  test('search input accepts text', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    const input = page.getByRole('textbox', { name: /Search by title/ })
    await input.fill('cloud')
    await expect(input).toHaveValue('cloud')
  })

  test('Escape closes search overlay', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).click()
    await expect(page.getByRole('textbox', { name: /Search by title/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('textbox', { name: /Search by title/ })).not.toBeVisible()
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
    // Click the "Landscape" view in the Views column
    await page.getByRole('button', { name: /Landscape/ }).click()
    // Should navigate to the view page
    await expect(page).toHaveURL(/\/view\/index\//)
  })
})
