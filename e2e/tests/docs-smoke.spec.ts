import { expect, test } from '@playwright/test'
import { TIMEOUT_PAGE } from '../helpers/timeouts'

/**
 * E2E smoke tests for the docs site (Astro/Starlight).
 * Run with: pnpm test:docs (from e2e/) or playwright test -c playwright.docs.config.ts
 */
const DOCS_HOME = '/'
const DOCS_TOOLING_DRAWIO = '/tooling/drawio/'
const DOCS_TOOLING_CLI = '/tooling/cli/'

test.describe('Docs site - smoke', () => {
  test('homepage loads and shows LikeC4 title', async ({ page }) => {
    await page.goto(DOCS_HOME)
    await expect(page).toHaveTitle(/LikeC4/i)
    await expect(page.getByRole('link', { name: /LikeC4/i }).first()).toBeVisible({ timeout: TIMEOUT_PAGE })
  })

  test('tooling Draw.io page loads and has expected content', async ({ page }) => {
    await page.goto(DOCS_TOOLING_DRAWIO)
    await expect(page).toHaveTitle(/Draw\.io|Drawio/i)
    await expect(page.getByText(/export.*Draw\.io|Draw\.io.*integration/i)).toBeVisible({
      timeout: TIMEOUT_PAGE,
    })
  })

  test('tooling CLI page loads', async ({ page }) => {
    await page.goto(DOCS_TOOLING_CLI)
    await expect(page.getByText(/CLI|command line/i).first()).toBeVisible({ timeout: TIMEOUT_PAGE })
  })
})
