import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { canvas, CANVAS_SELECTOR, editor, MENU_SELECTOR } from '../helpers/selectors'
import {
  TIMEOUT_DIAGRAM,
  TIMEOUT_DOWNLOAD,
  TIMEOUT_DOWNLOAD_ALL,
  TIMEOUT_EDITOR,
  TIMEOUT_EDITOR_MENU,
  TIMEOUT_MENU,
} from '../helpers/timeouts'

/**
 * E2E tests for DrawIO integration in the Playground.
 * Run with: pnpm test:playground (from e2e/) or
 *   pnpm exec playwright test -c playwright.playground.config.ts
 * Starts the playground on port 5174.
 */

const TUTORIAL_PATH = '/w/tutorial/'
const RIGHT_CLICK_CANVAS = { button: 'right' as const, position: { x: 200, y: 200 } }
const EDITOR_CLICK_POSITION = { x: 100, y: 50 }

async function openDrawioContextMenu(page: Page) {
  await canvas(page).click(RIGHT_CLICK_CANVAS)
  return page.locator(MENU_SELECTOR).first()
}

async function triggerDrawioDownload(
  page: Page,
  menuItemLabel: 'Export to DrawIO' | 'Export all',
  downloadTimeout: number,
): Promise<import('@playwright/test').Download> {
  const downloadPromise = page.waitForEvent('download', { timeout: downloadTimeout })
  const menu = await openDrawioContextMenu(page)
  await expect(menu).toBeVisible({ timeout: TIMEOUT_MENU })
  await menu.getByText(menuItemLabel, { exact: false }).click()
  return downloadPromise
}

test.describe('DrawIO in Playground', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(TUTORIAL_PATH)
    await page.waitForURL(/\/w\/tutorial\//)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForSelector(CANVAS_SELECTOR, { timeout: TIMEOUT_DIAGRAM })
  })

  test('workspace loads and diagram is visible', async ({ page }) => {
    await expect(canvas(page)).toBeVisible()
  })

  test('context menu shows DrawIO Export to DrawIO and Export all', async ({ page }) => {
    const menu = await openDrawioContextMenu(page)
    await expect(menu).toBeVisible({ timeout: TIMEOUT_MENU })
    await expect(menu.getByText('DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export to DrawIO', { exact: false })).toBeVisible()
    await expect(menu.getByText('Export all', { exact: false })).toBeVisible()
  })

  test('Export to DrawIO triggers download with valid .drawio content', async ({ page }) => {
    const download = await triggerDrawioDownload(page, 'Export to DrawIO', TIMEOUT_DOWNLOAD)
    expect(download.suggestedFilename()).toMatch(/\.drawio$/)
    const path = await download.path()
    expect(path, 'download path should be available').toBeTruthy()
    const { readFileSync } = await import('node:fs')
    const content = readFileSync(path!, 'utf8')
    expect(content).toContain('<mxfile')
    expect(content.length).toBeGreaterThan(200)
  })

  test('Export all triggers download with .drawio file', async ({ page }) => {
    const download = await triggerDrawioDownload(page, 'Export all', TIMEOUT_DOWNLOAD_ALL)
    expect(download.suggestedFilename()).toMatch(/\.drawio$/)
  })

  test('editor context menu shows Export to DrawIO', async ({ page }) => {
    const editorLocator = editor(page)
    await expect(editorLocator).toBeVisible({ timeout: TIMEOUT_EDITOR })
    await editorLocator.click({ position: EDITOR_CLICK_POSITION })
    await editorLocator.click({ button: 'right', position: EDITOR_CLICK_POSITION })
    const contextMenu = page.locator(MENU_SELECTOR).first()
    await expect(contextMenu).toBeVisible({ timeout: TIMEOUT_MENU })
    await expect(contextMenu.getByText('Export to DrawIO', { exact: false })).toBeVisible({
      timeout: TIMEOUT_EDITOR_MENU,
    })
  })
})
