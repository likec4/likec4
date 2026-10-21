import { type Page, expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

const DIFFS_PROJECT = 'model-diffs'
const PROJECT_WITHOUT_DIFFS = 'e2e'
const DIFF_TITLE = 'RFC 1: New API'
const MODEL_STATE_SELECTOR = 'input[aria-label="Model state"]'

function viewUrl(project: string, viewId: string): string {
  return `/project/${encodeURIComponent(project)}/view/${encodeURIComponent(viewId)}/`
}

function node(page: Page, title: string) {
  return page.locator('.react-flow__node').filter({ hasText: title })
}

test.describe('Static build: model diffs', () => {
  test('compare view shows the diff in changes and to-be modes', async ({ page }) => {
    await page.goto(viewUrl(DIFFS_PROJECT, 'index'))
    await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
    await expect(node(page, 'New API')).toHaveCount(0)

    await page.locator(MODEL_STATE_SELECTOR).click()
    await page.getByRole('option', { name: DIFF_TITLE }).click()

    await expect(page.getByText('This view is changed by the diff')).toBeVisible()
    await expect(node(page, 'New API')).toHaveClass(/likec4-diff-added/)
    await expect(node(page, 'Legacy API')).toHaveClass(/likec4-diff-removed/)

    await page.getByText('To-be', { exact: true }).click()
    await expect(node(page, 'New API')).toBeVisible()
    await expect(node(page, 'Legacy API')).toHaveCount(0)
  })

  test('projects without diffs show no model state selector', async ({ page }) => {
    await page.goto(viewUrl(PROJECT_WITHOUT_DIFFS, 'index'))
    await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
    await expect(page.locator(MODEL_STATE_SELECTOR)).toHaveCount(0)
  })
})
