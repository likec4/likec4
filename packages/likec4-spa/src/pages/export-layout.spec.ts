// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import {
  computeExportPageLayout,
  EXPORT_EXTRA_PADDING,
  EXPORT_NOTATION_GAP,
  EXPORT_NOTATION_WIDTH,
  exportNotationHeight,
} from './export-layout'

describe('computeExportPageLayout', () => {
  const bounds = {
    x: -100,
    y: 20,
    width: 640,
    height: 360,
  }

  it('keeps dimensions unchanged when there is no notation', () => {
    const layout = computeExportPageLayout({
      bounds,
      padding: 20,
      notationEntries: 0,
    })

    expect(layout).toEqual({
      width: bounds.width + 20 * 2 + EXPORT_EXTRA_PADDING,
      height: bounds.height + 20 * 2 + EXPORT_EXTRA_PADDING,
      diagram: {
        width: bounds.width + 20 * 2 + EXPORT_EXTRA_PADDING,
        height: bounds.height + 20 * 2 + EXPORT_EXTRA_PADDING,
      },
      notation: null,
    })
  })

  it('reserves a right-side notation column outside the diagram area', () => {
    const layout = computeExportPageLayout({
      bounds,
      padding: 20,
      notationEntries: 2,
    })

    expect(layout.notation).toEqual({
      left: layout.diagram.width + EXPORT_NOTATION_GAP,
      top: 20,
      width: EXPORT_NOTATION_WIDTH,
      height: exportNotationHeight(2),
    })
    expect(layout.width).toBe(layout.diagram.width + EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + 20)
    expect(layout.notation!.left).toBeGreaterThan(layout.diagram.width)
  })

  it('grows export height when the notation is taller than the diagram', () => {
    const layout = computeExportPageLayout({
      bounds: {
        ...bounds,
        height: 50,
      },
      padding: 20,
      notationEntries: 5,
    })

    expect(layout.height).toBe(exportNotationHeight(5) + 20 * 2)
    expect(layout.height).toBeGreaterThan(layout.diagram.height)
  })
})
