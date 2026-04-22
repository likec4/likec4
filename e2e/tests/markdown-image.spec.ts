import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * E2E test: markdown images in triple-quoted descriptions render as visible <img> tags (#2505).
 *
 * The 'cloud' element has a description with `![LikeC4 Logo](https://likec4.dev/favicon.svg)`.
 * This test opens the element details panel and verifies the image actually loads.
 */
test('markdown image in description renders in element details (#2505)', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/project/e2e/view/index/')
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  // Click the cloud node's details button
  await page.locator('[data-id="cloud"] .details-button button').click()

  // Wait for the element details dialog
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible({ timeout: 5000 })

  // The description must contain an <img> tag with the remote URL
  const img = dialog.locator('img[alt="LikeC4 Logo"]')
  await expect(img).toBeAttached({ timeout: 5000 })
  await expect(img).toHaveAttribute('src', 'https://likec4.dev/favicon.svg')

  // Verify the image actually loaded — not just present in DOM
  // naturalWidth > 0 confirms the browser decoded and rendered the image
  await expect.poll(
    () => img.evaluate(el => (el as HTMLImageElement).naturalWidth > 0),
    { timeout: 10000, message: 'Image should load successfully (naturalWidth > 0)' },
  ).toBe(true)
})
