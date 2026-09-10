// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type Page, expect, test } from '@playwright/test'

async function expectRenderedCase(page: Page, mode: 'scoped' | 'full') {
  const metadata = await (await page.request.get(`/case/${mode}/metadata`)).json()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto(`/case/${mode}`)
  const app = page.frameLocator('iframe')
  await expect(app.getByTestId('mcp-render-view-ready')).toBeVisible()
  await expect(app.getByText(/Connecting|Loading view|Failed to/)).toHaveCount(0)
  await expect(app.locator('.react-flow__node[data-id]')).toHaveCount(metadata.nodeCount)
  await expect(app.locator('.react-flow__edge[data-id]')).toHaveCount(metadata.edgeCount)
  expect(metadata.hasUnusedElement).toBe(mode === 'full')
  expect(errors).toEqual([])
}

test('renders a scoped render-view MCP App', async ({ page }) => {
  await expectRenderedCase(page, 'scoped')
})

test('renders a full-model render-view MCP App', async ({ page }) => {
  await expectRenderedCase(page, 'full')
})
