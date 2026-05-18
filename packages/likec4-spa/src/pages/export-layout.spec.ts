// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import {
  computeExportPageLayout,
  EXPORT_DESCRIPTION_GAP,
  EXPORT_DESCRIPTION_MAX_HEIGHT,
  EXPORT_DESCRIPTION_MIN_HEIGHT,
  EXPORT_EXTRA_PADDING,
  EXPORT_NOTATION_GAP,
  EXPORT_NOTATION_WIDTH,
  exportDescriptionHeight,
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
      description: null,
      notationEntries: 0,
    })

    expect(layout).toEqual({
      width: bounds.width + 20 * 2 + EXPORT_EXTRA_PADDING,
      height: bounds.height + 20 * 2 + EXPORT_EXTRA_PADDING,
      diagram: {
        left: 0,
        top: 0,
        width: bounds.width + 20 * 2 + EXPORT_EXTRA_PADDING,
        height: bounds.height + 20 * 2 + EXPORT_EXTRA_PADDING,
      },
      description: null,
      notation: null,
    })
  })

  it('reserves a top description banner outside the diagram area', () => {
    const description = {
      title: 'Cloud System',
      text: 'The overview of the cloud system',
    }
    const layout = computeExportPageLayout({
      bounds,
      padding: 20,
      description,
      notationEntries: 0,
    })
    const descriptionHeight = exportDescriptionHeight({
      ...description,
      width: layout.diagram.width,
    })

    expect(layout.description).toEqual({
      left: 0,
      top: 0,
      width: layout.diagram.width,
      height: descriptionHeight,
    })
    expect(descriptionHeight).toBe(EXPORT_DESCRIPTION_MIN_HEIGHT)
    expect(layout.diagram.top).toBe(descriptionHeight + EXPORT_DESCRIPTION_GAP)
    expect(layout.height).toBe(layout.diagram.top + layout.diagram.height)
  })

  it('grows and caps the description banner based on content length', () => {
    const layout = computeExportPageLayout({
      bounds: {
        ...bounds,
        width: 160,
      },
      padding: 20,
      description: {
        title: 'Long description',
        text: Array.from({ length: 20 }, () => 'This sentence should wrap into several rendered lines.').join(' '),
      },
      notationEntries: 0,
    })

    expect(layout.description!.height).toBe(EXPORT_DESCRIPTION_MAX_HEIGHT)
    expect(layout.diagram.top).toBe(EXPORT_DESCRIPTION_MAX_HEIGHT + EXPORT_DESCRIPTION_GAP)
  })

  it('treats long titles as a single ellipsized line', () => {
    const descriptionHeight = exportDescriptionHeight({
      title: 'A very long title that is intentionally much wider than the exported image and must be ellipsized',
      text: 'Brief',
      width: 120,
    })

    expect(descriptionHeight).toBe(EXPORT_DESCRIPTION_MIN_HEIGHT)
  })

  it('reserves a right-side notation column outside the diagram area', () => {
    const layout = computeExportPageLayout({
      bounds,
      padding: 20,
      description: null,
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

  it('places notation below the description banner when both are enabled', () => {
    const description = {
      title: 'Checkout Service',
      text: 'Retrieves user cart, prepares order and orchestrates payments, shipping and notification.',
    }
    const layout = computeExportPageLayout({
      bounds,
      padding: 20,
      description,
      notationEntries: 2,
    })

    const descriptionHeight = exportDescriptionHeight({
      ...description,
      width: layout.width,
    })

    expect(layout.description).toMatchObject({
      top: 0,
      width: layout.width,
      height: descriptionHeight,
    })
    expect(layout.diagram.top).toBe(descriptionHeight + EXPORT_DESCRIPTION_GAP)
    expect(layout.notation).toMatchObject({
      top: layout.diagram.top + 20,
      left: layout.diagram.width + EXPORT_NOTATION_GAP,
    })
  })

  it('grows export height when the notation is taller than the diagram', () => {
    const layout = computeExportPageLayout({
      bounds: {
        ...bounds,
        height: 50,
      },
      padding: 20,
      description: null,
      notationEntries: 5,
    })

    expect(layout.height).toBe(exportNotationHeight(5) + 20 * 2)
    expect(layout.height).toBeGreaterThan(layout.diagram.height)
  })
})
