import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * E2E tests for URL search parameters (?theme=, ?dynamic=, ?relationships=).
 *
 * Validates that each search param produces the correct observable effect
 * in the browser DOM (color scheme attribute, rendered node types, overlay).
 */

const PROJECT = 'e2e'
const STATIC_VIEW = 'index'
const DYNAMIC_VIEW = 'dynamic-view-1'

function exportUrl(viewId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ padding: '20', ...extra })
  return `/project/${encodeURIComponent(PROJECT)}/export/${encodeURIComponent(viewId)}/?${params.toString()}`
}

const COLOR_SCHEME_ATTR = 'data-mantine-color-scheme'

async function gotoAndWaitForCanvas(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
}

// ---------------------------------------------------------------------------
// ?theme=
// ---------------------------------------------------------------------------

test.describe('?theme= search parameter', () => {
  test('?theme=dark forces dark color scheme', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW, { theme: 'dark' }))
    await expect(page.locator(`[${COLOR_SCHEME_ATTR}]`).first())
      .toHaveAttribute(COLOR_SCHEME_ATTR, 'dark')
  })

  test('?theme=light forces light color scheme', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW, { theme: 'light' }))
    await expect(page.locator(`[${COLOR_SCHEME_ATTR}]`).first())
      .toHaveAttribute(COLOR_SCHEME_ATTR, 'light')
  })

  // Playwright config sets colorScheme: 'light', so the resolved default is always light.
  for (
    const [label, extra] of [
      ['auto', { theme: 'auto' }],
      ['absent', {}],
      ['invalid (sepia)', { theme: 'sepia' }],
    ] as const
  ) {
    test(`?theme=${label} does not force — falls back to light`, async ({ page }) => {
      await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW, extra))
      await expect(page.locator(`[${COLOR_SCHEME_ATTR}]`).first())
        .toHaveAttribute(COLOR_SCHEME_ATTR, 'light')
    })
  }
})

// ---------------------------------------------------------------------------
// ?dynamic=
// ---------------------------------------------------------------------------

test.describe('?dynamic= search parameter', () => {
  // Sequence variant renders seq-actor nodes; the default diagram variant does not.
  const SEQ_ACTOR_SELECTOR = '.react-flow__node-seq-actor'

  test('?dynamic=sequence renders sequence diagram variant', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(DYNAMIC_VIEW, { dynamic: 'sequence' }))
    await expect(page.locator(SEQ_ACTOR_SELECTOR).first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  for (
    const [label, dynamicValue] of [
      ['diagram', 'diagram'],
      ['invalid (timeline)', 'timeline'],
    ] as const
  ) {
    test(`?dynamic=${label} renders default diagram variant`, async ({ page }) => {
      await gotoAndWaitForCanvas(page, exportUrl(DYNAMIC_VIEW, { dynamic: dynamicValue }))
      await expect(page.locator(SEQ_ACTOR_SELECTOR)).toHaveCount(0)
    })
  }
})

// ---------------------------------------------------------------------------
// ?relationships=
// ---------------------------------------------------------------------------

test.describe('?relationships= search parameter', () => {
  const RELATIONSHIPS_BROWSER = '.relationships-browser'

  test('?relationships=<fqn> opens the relationship browser overlay', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW, { relationships: 'cloud' }))
    await expect(page.locator(RELATIONSHIPS_BROWSER).first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  test('absent ?relationships= does not open overlay', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW))
    await expect(page.locator(RELATIONSHIPS_BROWSER)).toHaveCount(0)
  })
})
