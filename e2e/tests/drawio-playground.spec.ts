import { expect, test } from '@playwright/test'

/**
 * E2E tests for DrawIO integration in the Playground.
 * Run with: pnpm test:playground (from e2e/) or
 *   pnpm exec playwright test -c playwright.playground.config.ts
 * Starts the playground on port 5174.
 */
test.describe('DrawIO in Playground', () => {
  test('context menu shows Import from DrawIO and Export to DrawIO', async ({ page }) => {
    await page.goto('/w/tutorial/')
    await page.waitForURL(/\/w\/tutorial/)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)
    const canvas = page.locator('.react-flow').or(page.locator('[data-id="likec4-diagram"]')).first()
    await canvas.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    await canvas.click({ button: 'right', position: { x: 200, y: 200 } })
    const menu = page.getByRole('menu').or(page.locator('.mantine-Menu-dropdown'))
    await expect(menu).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('DrawIO', { exact: false })).toBeVisible()
    await expect(page.getByText('Import from DrawIO', { exact: false })).toBeVisible()
    await expect(page.getByText('Export to DrawIO', { exact: false })).toBeVisible()
  })
})
