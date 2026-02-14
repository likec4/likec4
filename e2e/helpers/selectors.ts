/**
 * Shared selectors and helpers for Playwright E2E (playground and static site).
 * Single source of truth to avoid duplication between drawio-playground and static-navigation specs.
 */

import type { Locator, Page } from '@playwright/test'

export const CANVAS_SELECTOR = '.react-flow.initialized'
export const EDITOR_SELECTOR = '.monaco-editor'
export const MENU_SELECTOR = '[role="menu"], .mantine-Menu-dropdown'

export function canvas(page: Page): Locator {
  return page.locator(CANVAS_SELECTOR).first()
}

export function editor(page: Page): Locator {
  return page.locator(EDITOR_SELECTOR).first()
}
