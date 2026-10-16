// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { DiagramView, NonEmptyArray } from '@likec4/core'
import type { BrowserContext, Page } from 'playwright'
import { describe, expect, it, vi } from 'vitest'
import type { ViteLogger } from '../../../logger'
import { createExportViewUrl, takeScreenshot } from './takeScreenshot'

function parseExportUrl(url: string): URL {
  return new URL(url, 'http://likec4.test/')
}

describe('createExportViewUrl', () => {
  it('omits optional decoration query parameters by default', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'customer view',
      padding: 20,
      theme: 'light',
    }))

    expect(url.pathname).toBe('/export/customer%20view/')
    expect(url.searchParams.get('padding')).toBe('20')
    expect(url.searchParams.get('theme')).toBe('light')
    expect(url.searchParams.has('notation')).toBe(false)
    expect(url.searchParams.has('description')).toBe(false)
  })

  it('adds notation query parameter when requested', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'dark',
      notation: true,
    }))

    expect(url.pathname).toBe('/export/orders/')
    expect(url.searchParams.get('notation')).toBe('true')
  })

  it('adds description query parameter when requested', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'dark',
      description: true,
    }))

    expect(url.pathname).toBe('/export/orders/')
    expect(url.searchParams.get('description')).toBe('true')
  })

  it('keeps JPEG and dynamic export query parameters with decorations', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'checkout',
      padding: 24,
      theme: 'dark',
      dynamicVariant: 'sequence',
      format: 'jpeg',
      notation: true,
      description: true,
    }))

    expect(url.searchParams.get('padding')).toBe('24')
    expect(url.searchParams.get('theme')).toBe('dark')
    expect(url.searchParams.get('dynamic')).toBe('sequence')
    expect(url.searchParams.get('format')).toBe('jpeg')
    expect(url.searchParams.get('notation')).toBe('true')
    expect(url.searchParams.get('description')).toBe('true')
  })
})

describe('takeScreenshot readiness', () => {
  const view = {
    id: 'noted-view',
    bounds: { x: 0, y: 0, width: 640, height: 480 },
    nodes: [],
    _type: 'element',
  } as unknown as DiagramView

  function setup(ready: () => Promise<void>) {
    const order: string[] = []
    const viewportSizes: Array<{ width: number; height: number }> = []
    const screenshot = vi.fn<() => Promise<void>>(async () => {
      order.push('screenshot')
    })
    const page = {
      setViewportSize: async (size: { width: number; height: number }) => {
        viewportSizes.push(size)
      },
      goto: async () => {},
      locator: (selector: string) => {
        expect(selector).toBe('[data-likec4-export-ready="true"]')
        return {
          waitFor: async (options: { state: string; timeout: number }) => {
            expect(options).toEqual({ state: 'attached', timeout: 250 })
            await ready()
            order.push('ready')
          },
        }
      },
      getByTestId: (testId: string) => {
        expect(testId).toBe('export-page')
        return {
          boundingBox: async () => {
            order.push('bounds')
            return { x: 0, y: 0, width: 1000, height: 700 }
          },
          screenshot,
        }
      },
      viewportSize: () => viewportSizes.at(-1),
      close: async () => {},
    } as unknown as Page
    const browserContext = {
      newPage: async () => page,
    } as unknown as BrowserContext
    const loggerError = vi.fn<(message: string) => void>()
    const logger = {
      info: () => {},
      warn: () => {},
      error: loggerError,
    } as unknown as ViteLogger
    return { browserContext, logger, loggerError, order, screenshot, viewportSizes }
  }

  it('waits for the committed export bounds before resizing and capturing JPEG', async () => {
    const { browserContext, logger, order, screenshot, viewportSizes } = setup(async () => {})
    const result = await takeScreenshot({
      browserContext,
      views: [view] as NonEmptyArray<DiagramView>,
      output: '/tmp/likec4-export-test',
      logger,
      timeout: 250,
      maxAttempts: 1,
      outputType: 'flat',
      theme: 'light',
      format: 'jpeg',
    })

    expect(order).toEqual(['ready', 'bounds', 'screenshot'])
    expect(viewportSizes).toEqual([
      { width: 700, height: 540 },
      { width: 1000, height: 700 },
    ])
    expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({ type: 'jpeg', quality: 80 }))
    expect(result).toHaveLength(1)
  })

  it('does not capture PNG when the ready marker times out', async () => {
    const { browserContext, logger, loggerError, screenshot } = setup(async () => {
      throw new Error('Timed out waiting for note placement')
    })
    const result = await takeScreenshot({
      browserContext,
      views: [view] as NonEmptyArray<DiagramView>,
      output: '/tmp/likec4-export-test',
      logger,
      timeout: 250,
      maxAttempts: 1,
      outputType: 'flat',
      theme: 'light',
    })

    expect(result).toEqual([])
    expect(screenshot).not.toHaveBeenCalled()
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('Timed out waiting for note placement'))
  })
})
