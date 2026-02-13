import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * E2E test for static site (likec4 start): navigate between views and assert diagram updates.
 * Run with the main Playwright config (likec4 start on 5173); bootstrap must have run so e2e project exists.
 * URL shape matches bootstrap-generated snapshot tests: /project/{project}/export/{viewId}/?padding=22
 */

const PROJECT = 'e2e'
const PADDING = '22'
const VIEW_IDS = ['index', 'cloud', 'amazon'] as const

function viewUrl(viewId: string): string {
  return `/project/${encodeURIComponent(PROJECT)}/export/${encodeURIComponent(viewId)}/?padding=${PADDING}`
}

async function gotoViewAndAssertDiagram(page: Page, viewId: string): Promise<void> {
  await page.goto(viewUrl(viewId))
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
}

test.describe('Static site - navigation between views', () => {
  test('navigating between views updates the diagram', async ({ page }) => {
    for (const viewId of VIEW_IDS) {
      await gotoViewAndAssertDiagram(page, viewId)
    }
  })
})
