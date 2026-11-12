import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * E2E test for the app config and UI customization.
 * The site is built from `fixtures/app-config` (`likec4.app.config.ts` points to `likec4.customization.tsx`)
 * and served by the second web server of the main Playwright config.
 */
const SITE = 'http://127.0.0.1:5176'
const VIEW = 'index'
/** Elements of the `index` view in fixtures/app-config/model.c4 */
const ELEMENTS = 3
/** Root of the shape drawn by the built-in `ElementShape` */
const BUILTIN_SHAPE = '.likec4-shape-outline, .likec4-element-shape'

test.describe('App config and UI customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${SITE}/view/${VIEW}/`)
    await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  test('the replaced ElementShape slot draws every element', async ({ page }) => {
    await expect(page.getByTestId('custom-shape')).toHaveCount(ELEMENTS)
    await expect(page.locator('[data-testid="custom-shape"][data-shape="person"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="custom-shape"][data-shape="storage"]')).toHaveCount(1)
    await expect(page.locator(BUILTIN_SHAPE)).toHaveCount(0)
  })

  test('the wrapped LikeC4Diagram slot keeps the built-in diagram', async ({ page }) => {
    await expect(page.getByTestId('custom-wrap')).toBeVisible()
    await expect(page.locator('.react-flow__node')).toHaveCount(ELEMENTS)
  })
})
