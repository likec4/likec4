import { expect, test } from '@playwright/test'

/**
 * E2E tests for DrawIO integration in the Playground.
 * Run with: pnpm test:playground (from e2e/) or
 *   pnpm exec playwright test -c playwright.playground.config.ts
 * Starts the playground on port 5174.
 */
test.describe('DrawIO in Playground', () => {
  test('context menu shows DrawIO Export to DrawIO and Export all', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/w/tutorial/')
    await page.waitForURL(/\/w\/tutorial/)
    await page.waitForLoadState('networkidle').catch(() => {})
    // Wait for diagram to be ready (playground config only; CI uses different server)
    await page.waitForSelector('.react-flow.initialized', { timeout: 45000 })
    const canvas = page.locator('.react-flow.initialized').first()
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    const menu = page.getByRole('menu').or(page.locator('.mantine-Menu-dropdown'))
    await expect(menu).toBeVisible({ timeout: 5000 })
    await expect(menu.getByText('DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export to DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export all', { exact: false })).toBeVisible()
  })
})
