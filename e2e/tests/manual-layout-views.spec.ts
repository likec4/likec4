import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * E2E test: views with manual layout snapshots (.likec4.snap) render without crashing
 * on the interactive view route (#2882).
 *
 * The export route (/export/) uses a different rendering path and was not affected.
 * This test covers the interactive route (/view/) which calls LikeC4ViewModel.$layouted.
 */
test('view with manual layout renders on interactive route (#2882)', async ({ page }) => {
  test.setTimeout(30_000)
  // Navigate to the interactive view route (not export)
  await page.goto('/project/e2e/view/view-with-custom-colors/')

  // Should render the diagram, not a red error screen
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })

  // Verify no error boundary fired
  const errorText = page.locator('text=Something went wrong')
  await expect(errorText).not.toBeVisible()
})
