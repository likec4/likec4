import { expect, test } from '@playwright/test'

/**
 * E2E tests for DrawIO integration in the Playground.
 * Run with: pnpm test:playground (from e2e/) or
 *   pnpm exec playwright test -c playwright.playground.config.ts
 * Starts the playground on port 5174.
 */
test.describe('DrawIO in Playground', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/w/tutorial/')
    await page.waitForURL(/\/w\/tutorial/)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForSelector('.react-flow.initialized', { timeout: 45000 })
  })

  test('workspace loads and diagram is visible', async ({ page }) => {
    const canvas = page.locator('.react-flow.initialized').first()
    await expect(canvas).toBeVisible()
  })

  test('context menu shows DrawIO Export to DrawIO and Export all', async ({ page }) => {
    const canvas = page.locator('.react-flow.initialized').first()
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    const menu = page.getByRole('menu').or(page.locator('.mantine-Menu-dropdown'))
    await expect(menu).toBeVisible({ timeout: 5000 })
    await expect(menu.getByText('DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export to DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export all', { exact: false })).toBeVisible()
  })

  test('Export to DrawIO triggers download with valid .drawio content', async ({ page }) => {
    const canvas = page.locator('.react-flow.initialized').first()
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    const menu = page.getByRole('menu').or(page.locator('.mantine-Menu-dropdown'))
    await expect(menu).toBeVisible({ timeout: 5000 })
    await menu.getByText('Export to DrawIO', { exact: false }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.drawio$/)
    const path = await download.path()
    if (path) {
      const { readFileSync } = await import('node:fs')
      const content = readFileSync(path, 'utf8')
      expect(content).toContain('<mxfile')
      expect(content.length).toBeGreaterThan(200)
    }
  })

  test('Export all triggers download with .drawio file', async ({ page }) => {
    const canvas = page.locator('.react-flow.initialized').first()
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    const menu = page.getByRole('menu').or(page.locator('.mantine-Menu-dropdown'))
    await expect(menu).toBeVisible({ timeout: 5000 })
    await menu.getByText('Export all', { exact: false }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.drawio$/)
  })

  test('editor context menu shows Export to DrawIO', async ({ page }) => {
    const editor = page.locator('.monaco-editor').first()
    await expect(editor).toBeVisible({ timeout: 10000 })
    await editor.click({ position: { x: 100, y: 50 } })
    await editor.click({ button: 'right', position: { x: 100, y: 50 } })
    const contextMenu = page.getByRole('menu').or(page.locator('[role="menu"]'))
    await expect(contextMenu).toBeVisible({ timeout: 5000 })
    await expect(contextMenu.getByText('Export to DrawIO', { exact: false })).toBeVisible({ timeout: 3000 })
  })
})
