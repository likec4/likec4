import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { canvas } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

/**
 * Geometry of the export page with the notation and description panels.
 *
 * The layout is a CSS grid, and the panel heights depend on the fonts of the platform.
 * So these tests compare the positions of the areas with each other instead of screenshots,
 * and they hold on every platform.
 */

const PROJECT = 'e2e'
const PADDING = 22
// Keep in sync with packages/likec4-spa/src/pages/export-layout.ts
const EXTRA_PADDING = 16
const NOTATION_GAP = 24
const NOTATION_WIDTH = 320
const DESCRIPTION_GAP = 16
const DESCRIPTION_MAX_HEIGHT = 240

type Box = { x: number; y: number; width: number; height: number }

function exportUrl(viewId: string, params: Record<string, string | boolean>): string {
  const search = new URLSearchParams({ padding: String(PADDING) })
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  return `/project/${encodeURIComponent(PROJECT)}/export/${encodeURIComponent(viewId)}/?${search}`
}

async function box(locator: Locator): Promise<Box> {
  const result = await locator.boundingBox()
  expect(result, 'element has a bounding box').not.toBeNull()
  return result!
}

async function openExport(page: Page, viewId: string, params: Record<string, string | boolean>) {
  await page.goto(exportUrl(viewId, params))
  await expect(canvas(page)).toBeVisible({ timeout: TIMEOUT_CANVAS })
  return {
    page: await box(page.getByTestId('export-page')),
    diagram: await box(page.getByTestId('export-diagram-area')),
  }
}

function bottom(b: Box): number {
  return b.y + b.height
}

function right(b: Box): number {
  return b.x + b.width
}

function expectInside(inner: Box, outer: Box) {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - 0.5)
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - 0.5)
  expect(right(inner)).toBeLessThanOrEqual(right(outer) + 0.5)
  expect(bottom(inner)).toBeLessThanOrEqual(bottom(outer) + 0.5)
}

function expectNoOverlap(a: Box, b: Box) {
  const separated = right(a) <= b.x + 0.5 || right(b) <= a.x + 0.5 || bottom(a) <= b.y + 0.5 || bottom(b) <= a.y + 0.5
  expect(separated, `${JSON.stringify(a)} and ${JSON.stringify(b)} do not overlap`).toBe(true)
}

test.describe('Export page - notation and description layout', () => {
  for (const notationPosition of ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const) {
    test(`notation in the ${notationPosition} corner`, async ({ page }) => {
      const areas = await openExport(page, 'ortho-routing', { notation: true, notationPosition })
      const notation = await box(page.getByTestId('export-notation'))

      expectInside(areas.diagram, areas.page)
      expectInside(notation, areas.page)
      expectNoOverlap(notation, areas.diagram)
      expect(notation.width).toBeCloseTo(NOTATION_WIDTH, 0)
      expect(areas.page.width).toBeCloseTo(areas.diagram.width + NOTATION_GAP + NOTATION_WIDTH + PADDING, 0)

      if (notationPosition.endsWith('left')) {
        expect(notation.x - areas.page.x).toBeCloseTo(PADDING, 0)
        expect(areas.diagram.x - right(notation)).toBeCloseTo(NOTATION_GAP, 0)
      } else {
        expect(notation.x - right(areas.diagram)).toBeCloseTo(NOTATION_GAP, 0)
        expect(right(areas.page) - right(notation)).toBeCloseTo(PADDING, 0)
      }

      if (notationPosition.startsWith('top')) {
        expect(notation.y - areas.diagram.y).toBeCloseTo(PADDING, 0)
      } else {
        // the panel ends at the bottom edge of the drawn diagram, above the extra padding
        expect(bottom(areas.page) - bottom(notation)).toBeCloseTo(PADDING + EXTRA_PADDING, 0)
      }
      // the diagram area reaches the bottom of the canvas, also when the notation is taller
      expect(bottom(areas.diagram)).toBeCloseTo(bottom(areas.page), 0)
    })
  }

  test('description panel takes the height of a short description', async ({ page }) => {
    const areas = await openExport(page, 'ortho-routing', { description: true })
    const panel = page.getByTestId('export-description')
    const description = await box(panel)

    expectInside(description, areas.page)
    expect(description.width).toBeCloseTo(areas.page.width, 0)
    expect(description.height).toBeLessThan(DESCRIPTION_MAX_HEIGHT)
    expect(areas.diagram.y - bottom(description)).toBeCloseTo(DESCRIPTION_GAP, 0)
    // nothing of the text is cut off
    const overflow = await panel.evaluate(el =>
      [...el.querySelectorAll<HTMLElement>('*')].some(child => child.scrollHeight > child.clientHeight + 1)
    )
    expect(overflow).toBe(false)
  })

  test('description panel is capped for a long description', async ({ page }) => {
    const areas = await openExport(page, 'index', { description: true })
    const description = await box(page.getByTestId('export-description'))

    expect(description.height).toBeCloseTo(DESCRIPTION_MAX_HEIGHT, 0)
    expect(areas.diagram.y - bottom(description)).toBeCloseTo(DESCRIPTION_GAP, 0)
  })

  test('description spans the notation column', async ({ page }) => {
    const areas = await openExport(page, 'ortho-routing', {
      description: true,
      notation: true,
      notationPosition: 'top-left',
    })
    const description = await box(page.getByTestId('export-description'))
    const notation = await box(page.getByTestId('export-notation'))

    expect(description.width).toBeCloseTo(areas.page.width, 0)
    expectNoOverlap(description, notation)
    expectNoOverlap(description, areas.diagram)
    expect(notation.y - areas.diagram.y).toBeCloseTo(PADDING, 0)
  })
})
