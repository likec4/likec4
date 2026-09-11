// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type Page, expect, test } from '@playwright/test'

type Mode = 'scoped' | 'full' | 'compact' | 'standard' | 'large' | 'no-fit' | 'zoom'

interface RenderMetadata {
  nodeCount: number
  edgeCount: number
  hasUnusedElement: boolean
  render: {
    size: 'compact' | 'standard' | 'large'
    fitView: boolean
    initialZoom?: number
  }
  expectedZoom: number
}

async function expectRenderedCase(page: Page, mode: Mode, expectDetails = false) {
  const metadata = await (await page.request.get(`/case/${mode}/metadata`)).json() as RenderMetadata
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto(`/case/${mode}`)
  const app = page.frameLocator('iframe')
  await expect(app.getByTestId('mcp-render-view-ready')).toBeVisible()
  await expect(app.getByTestId('mcp-render-view-ready')).toHaveAttribute('data-size', metadata.render.size)
  await expect(app.locator('.react-flow__viewport')).toHaveAttribute(
    'style',
    expect.stringContaining(`scale(${metadata.expectedZoom})`),
  )
  await expect(app.getByText(/Connecting|Loading view|Failed to/)).toHaveCount(0)
  await expect(app.locator('.react-flow__node[data-id]')).toHaveCount(metadata.nodeCount)
  await expect(app.locator('.react-flow__edge[data-id]')).toHaveCount(metadata.edgeCount)
  await expect(app.locator('[data-likec4-icon^="data:image/svg+xml"]').first()).toBeVisible()
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
}

test('renders a scoped render-view MCP App', async ({ page }) => {
  await expectRenderedCase(page, 'scoped', true)
})

test('renders a full-model render-view MCP App', async ({ page }) => {
  await expectRenderedCase(page, 'full', true)
})

for (const mode of ['scoped', 'compact', 'standard', 'large'] as const) {
  test(`keeps fit-to-view enabled for the ${mode} render-view MCP App`, async ({ page }) => {
    await expectRenderedCase(page, mode)
    const metadata = await (await page.request.get(`/case/${mode}/metadata`)).json() as RenderMetadata
    expect(metadata.render.fitView).toBe(true)
  })
}

test('renders the no-fit render-view MCP App at centered zoom 1', async ({ page }) => {
  await expectRenderedCase(page, 'no-fit')
})

test('renders the explicit zoom render-view MCP App at zoom 0.75', async ({ page }) => {
  await expectRenderedCase(page, 'zoom')
})
