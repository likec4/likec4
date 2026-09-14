// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type FrameLocator, type Page, expect, test } from '@playwright/test'

type Mode = 'scoped' | 'full' | 'preview' | 'compact' | 'standard' | 'large' | 'no-fit' | 'zoom'

const minimumCanvasHeight = {
  compact: 360,
  standard: 540,
  large: 720,
} as const

interface RenderMetadata {
  nodeCount: number
  edgeCount: number
  hasUnusedElement: boolean
  render: {
    size: 'compact' | 'standard' | 'large'
    fitView: boolean
    initialZoom?: number
  }
  viewBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  expectedZoom: number | null
}

async function settledViewport(app: FrameLocator) {
  const transform = await app.locator('.react-flow__viewport').evaluate(element =>
    new Promise<string>((resolve) => {
      let previous = ''
      let stableFrames = 0

      const observe = () => {
        const current = (element as HTMLElement).style.transform
        if (current && current === previous) {
          stableFrames += 1
        } else {
          previous = current
          stableFrames = 0
        }
        if (stableFrames >= 30) {
          resolve(current)
          return
        }
        requestAnimationFrame(observe)
      }
      requestAnimationFrame(observe)
    })
  )
  const parsed = /^translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([-\d.]+)\)$/.exec(transform)
  expect(parsed, `unexpected settled viewport transform: ${transform}`).not.toBeNull()
  return {
    x: Number(parsed![1]),
    y: Number(parsed![2]),
    zoom: Number(parsed![3]),
  }
}

async function expectRenderedCase(page: Page, mode: Mode, expectDetails = false, expectIcon = true) {
  const metadata = await (await page.request.get(`/case/${mode}/metadata`)).json() as RenderMetadata
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto(`/case/${mode}`)
  const app = page.frameLocator('iframe')
  const ready = app.getByTestId('mcp-render-view-ready')
  await expect(ready).toBeVisible()
  await expect(ready).toHaveAttribute('data-size', metadata.render.size)
  expect(await ready.evaluate(element => getComputedStyle(element).minHeight)).toBe(
    `${minimumCanvasHeight[metadata.render.size]}px`,
  )
  await expect(app.locator('.react-flow__controls')).toBeVisible()

  const viewport = await settledViewport(app)
  const viewportSize = await app.locator('.react-flow').evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))
  if (metadata.expectedZoom !== null) {
    expect(viewport.zoom).toBeCloseTo(metadata.expectedZoom, 5)
  }
  const renderedCenter = {
    x: viewport.x + (metadata.viewBounds.x + metadata.viewBounds.width / 2) * viewport.zoom,
    y: viewport.y + (metadata.viewBounds.y + metadata.viewBounds.height / 2) * viewport.zoom,
  }
  expect(Math.abs(renderedCenter.x - viewportSize.width / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(renderedCenter.y - viewportSize.height / 2)).toBeLessThanOrEqual(1)
  await expect(app.getByText(/Connecting|Loading view|Failed to/)).toHaveCount(0)
  await expect(app.locator('.react-flow__node[data-id]')).toHaveCount(metadata.nodeCount)
  await expect(app.locator('.react-flow__edge[data-id]')).toHaveCount(metadata.edgeCount)
  if (expectIcon) {
    await expect(app.locator('[data-likec4-icon^="data:image/svg+xml"]').first()).toBeVisible()
  }
  if (expectDetails) {
    const apiNode = app.locator('.react-flow__node[data-id="api"]')
    await apiNode.hover()
    await apiNode.getByRole('button', { name: 'Open details' }).press('Enter')
    const elementDetails = app.locator('dialog[open]')
    await expect(elementDetails).toBeVisible()
    await elementDetails.press('Escape')
    await expect(elementDetails).toHaveCount(0)
    const edge = app.locator('.react-flow__edge[data-id]').first()
    await edge.locator('.likec4-edge__path').click({ force: true })
    await edge.locator('.likec4-edge-middle-point').hover({ force: true })
    await app.getByRole('button', { name: 'browse relationships' }).click()
    await expect(app.locator('.likec4-relationship-details')).toBeVisible()
  }
  expect(metadata.hasUnusedElement).toBe(mode === 'full')
  expect(errors).toEqual([])
  return viewport
}

test('renders a scoped render-view MCP App', async ({ page }) => {
  const viewport = await expectRenderedCase(page, 'scoped', true)
  expect(viewport.zoom).toBeLessThan(1)
})

test('renders a full-model render-view MCP App', async ({ page }) => {
  await expectRenderedCase(page, 'full', true)
})

test('renders a preview-view MCP App with default render options', async ({ page }) => {
  await expectRenderedCase(page, 'preview', true, false)
})

for (const mode of ['scoped', 'compact', 'standard', 'large'] as const) {
  test(`keeps fit-to-view enabled for the ${mode} render-view MCP App`, async ({ page }) => {
    await expectRenderedCase(page, mode)
    const metadata = await (await page.request.get(`/case/${mode}/metadata`)).json() as RenderMetadata
    expect(metadata.render.fitView).toBe(true)
  })
}

test('renders the no-fit render-view MCP App at centered zoom 1', async ({ page }) => {
  const viewport = await expectRenderedCase(page, 'no-fit')
  expect(viewport.zoom).toBe(1)
})

test('renders the explicit zoom render-view MCP App at zoom 0.75', async ({ page }) => {
  await expectRenderedCase(page, 'zoom')
  const app = page.frameLocator('iframe')
  await app.locator('.react-flow__controls-fitview').click()
  const fittedViewport = await settledViewport(app)
  expect(fittedViewport.zoom).toBeGreaterThan(0.75)
  expect(fittedViewport.zoom).toBeLessThan(1)
})
