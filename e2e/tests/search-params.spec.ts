// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS, TIMEOUT_MENU } from '../helpers/timeouts'

/**
 * E2E tests for URL search parameters (?theme=, ?dynamic=, ?relationships=).
 *
 * Validates that each search param produces the correct observable effect
 * in the browser DOM (color scheme attribute, rendered node types, overlay).
 *
 * - ?theme= tests use the **export** route (lightweight, no interactive features needed).
 * - ?dynamic= and ?relationships= tests use the **view** route because
 *   those features (dynamic variant switching, relationship browser) are only
 *   wired up in the interactive ViewReact page, not in ExportPage.
 */

const PROJECT = 'e2e'
const EXPORT_CONFIG_PROJECT = 'export-config'
const EXPORT_DISABLED_PROJECT = 'export-disabled'
const STATIC_VIEW = 'index'
const DYNAMIC_VIEW = 'dynamic-view-1'

function projectExportUrl(projectId: string, viewId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ padding: '22', ...extra })
  return `/project/${encodeURIComponent(projectId)}/export/${encodeURIComponent(viewId)}/?${params.toString()}`
}

function exportUrl(viewId: string, extra?: Record<string, string>): string {
  return projectExportUrl(PROJECT, viewId, extra)
}

function projectViewUrl(projectId: string, viewId: string, extra?: Record<string, string>): string {
  const params = extra ? new URLSearchParams(extra) : undefined
  const qs = params?.toString()
  return `/project/${encodeURIComponent(projectId)}/view/${encodeURIComponent(viewId)}/${qs ? `?${qs}` : ''}`
}

function viewUrl(viewId: string, extra?: Record<string, string>): string {
  return projectViewUrl(PROJECT, viewId, extra)
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
      ['?theme=auto', { theme: 'auto' }],
      ['no ?theme= param', {}],
      ['?theme=sepia (invalid)', { theme: 'sepia' }],
    ] as const
  ) {
    test(`${label} does not force — falls back to light`, async ({ page }) => {
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
    await gotoAndWaitForCanvas(page, viewUrl(DYNAMIC_VIEW, { dynamic: 'sequence' }))
    await expect(page.locator(SEQ_ACTOR_SELECTOR).first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  for (
    const [label, extra] of [
      ['?dynamic=diagram', { dynamic: 'diagram' }],
      ['no ?dynamic= param', {}],
      ['?dynamic=timeline (invalid)', { dynamic: 'timeline' }],
    ] as const
  ) {
    test(`${label} renders default diagram variant`, async ({ page }) => {
      await gotoAndWaitForCanvas(page, viewUrl(DYNAMIC_VIEW, extra))
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
    await gotoAndWaitForCanvas(page, viewUrl(STATIC_VIEW, { relationships: 'cloud' }))
    await expect(page.locator(RELATIONSHIPS_BROWSER).first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  test('?relationships=<fqn> export menu opens relationship source route', async ({ page }) => {
    await gotoAndWaitForCanvas(page, viewUrl(STATIC_VIEW, { relationships: 'cloud', relationshipScope: 'view' }))

    await page.getByRole('button', { name: 'Export relationship view' }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: TIMEOUT_MENU })

    await page.getByRole('menuitem', { name: 'Export as .d2' }).click()
    await expect(page).toHaveURL(/\/project\/e2e\/view\/index\/d2\/\?relationships=cloud&relationshipScope=view$/)
    await expect(page.getByText(/direction: right/)).toBeVisible()
    await expect(page.getByText(/Cloud System/)).toBeVisible()
  })

  test('?relationships=<fqn> renders relationship image export route', async ({ page }) => {
    await gotoAndWaitForCanvas(page, exportUrl(STATIC_VIEW, { relationships: 'cloud', relationshipScope: 'view' }))

    await expect(page.getByText('Oops, something went wrong')).toHaveCount(0)
    await expect(page.getByText('all points should be consumed')).toHaveCount(0)
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
    await expect(page.locator('.react-flow__edge').first()).toBeVisible({ timeout: TIMEOUT_CANVAS })
  })

  test('absent ?relationships= does not open overlay', async ({ page }) => {
    await gotoAndWaitForCanvas(page, viewUrl(STATIC_VIEW))
    await expect(page.locator(RELATIONSHIPS_BROWSER)).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// webapp.exportFormats
// ---------------------------------------------------------------------------

test.describe('webapp.exportFormats configuration', () => {
  const DISABLED_MENU_ITEMS = [
    'Export as .jpg',
    'Export as .dot',
    'Export as .d2',
    'Export as .mmd',
    'Export as .puml',
    'Export to Draw.io',
  ] as const

  test('limits the view export menu to enabled formats', async ({ page }) => {
    await gotoAndWaitForCanvas(page, projectViewUrl(EXPORT_CONFIG_PROJECT, STATIC_VIEW))

    await page.getByRole('button', { name: 'Export', exact: true }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: TIMEOUT_MENU })
    await expect(page.getByRole('menuitem', { name: 'Export as .png' })).toBeVisible()
    for (const item of DISABLED_MENU_ITEMS) {
      await expect(page.getByRole('menuitem', { name: item })).toHaveCount(0)
    }

    await gotoAndWaitForCanvas(page, projectExportUrl(EXPORT_CONFIG_PROJECT, STATIC_VIEW))
  })

  test('removes export entry points when every webapp export format is disabled', async ({ page }) => {
    await gotoAndWaitForCanvas(page, projectViewUrl(EXPORT_DISABLED_PROJECT, STATIC_VIEW))

    await expect(page.getByRole('button', { name: 'Export', exact: true })).toHaveCount(0)
  })
})
