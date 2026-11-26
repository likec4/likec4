// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import {
  type ExportNotationPosition,
  EXPORT_DESCRIPTION_GAP,
  EXPORT_DESCRIPTION_MAX_HEIGHT,
  EXPORT_DESCRIPTION_MIN_HEIGHT,
  EXPORT_EXTRA_PADDING,
  EXPORT_NOTATION_GAP,
  EXPORT_NOTATION_WIDTH,
  ExportNotationPositions,
  exportNotationShortTitle,
  exportPageGrid,
} from './export-layout'

describe('exportPageGrid', () => {
  const bounds = { width: 640, height: 360 }
  const padding = 20
  const diagramWidth = bounds.width + padding * 2 + EXPORT_EXTRA_PADDING
  const diagramHeight = bounds.height + padding * 2 + EXPORT_EXTRA_PADDING
  const notationColumn = EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + padding

  it('makes the canvas exactly the diagram area without panels', () => {
    const grid = exportPageGrid({ bounds, padding, description: false, notationPosition: null })

    expect(grid).toEqual({
      page: {
        display: 'grid',
        gridTemplateColumns: `${diagramWidth}px`,
        gridTemplateRows: 'auto',
        gridTemplateAreas: '"diagram"',
      },
      diagram: {
        gridArea: 'diagram',
        position: 'relative',
        overflow: 'hidden',
        width: diagramWidth,
        minHeight: diagramHeight,
      },
      description: null,
      notation: null,
    })
  })

  it('keeps the diagram area at the view bounds plus padding in every layout', () => {
    for (const notationPosition of [null, ...ExportNotationPositions]) {
      for (const description of [false, true]) {
        const grid = exportPageGrid({ bounds, padding, description, notationPosition })
        expect(grid.diagram, `${notationPosition} / description ${description}`).toMatchObject({
          width: diagramWidth,
          minHeight: diagramHeight,
        })
      }
    }
  })

  it('puts the description above the diagram, across the full width', () => {
    const grid = exportPageGrid({ bounds, padding, description: true, notationPosition: null })

    expect(grid.page).toMatchObject({
      gridTemplateRows: 'auto auto',
      gridTemplateAreas: '"description" "diagram"',
    })
    expect(grid.description).toEqual({
      gridArea: 'description',
      boxSizing: 'border-box',
      minHeight: EXPORT_DESCRIPTION_MIN_HEIGHT,
      maxHeight: EXPORT_DESCRIPTION_MAX_HEIGHT,
      marginBottom: EXPORT_DESCRIPTION_GAP,
    })
  })

  it('lets the description span the notation column too', () => {
    const grid = exportPageGrid({ bounds, padding, description: true, notationPosition: 'top-left' })

    expect(grid.page.gridTemplateAreas).toBe('"description description" "notation diagram"')
  })

  it.each<[ExportNotationPosition, string, string]>([
    ['top-left', `${notationColumn}px ${diagramWidth}px`, '"notation diagram"'],
    ['bottom-left', `${notationColumn}px ${diagramWidth}px`, '"notation diagram"'],
    ['top-right', `${diagramWidth}px ${notationColumn}px`, '"diagram notation"'],
    ['bottom-right', `${diagramWidth}px ${notationColumn}px`, '"diagram notation"'],
  ])('gives a %s notation its own column', (notationPosition, columns, areas) => {
    const grid = exportPageGrid({ bounds, padding, description: false, notationPosition })

    expect(grid.page).toMatchObject({
      gridTemplateColumns: columns,
      gridTemplateAreas: areas,
    })
    expect(grid.notation).toMatchObject({
      gridArea: 'notation',
      width: EXPORT_NOTATION_WIDTH,
    })
  })

  it.each<[ExportNotationPosition, 'start' | 'end', number]>([
    ['top-left', 'start', padding],
    ['top-right', 'start', padding],
    // bottom edge of the panel meets the bottom edge of the drawn diagram, above the extra padding
    ['bottom-left', 'end', padding + EXPORT_EXTRA_PADDING],
    ['bottom-right', 'end', padding + EXPORT_EXTRA_PADDING],
  ])('aligns a %s notation vertically', (notationPosition, alignSelf, marginBottom) => {
    const grid = exportPageGrid({ bounds, padding, description: false, notationPosition })

    expect(grid.notation).toMatchObject({
      alignSelf,
      marginTop: padding,
      marginBottom,
    })
  })

  it.each<[ExportNotationPosition, number, number]>([
    ['top-left', padding, EXPORT_NOTATION_GAP],
    ['bottom-left', padding, EXPORT_NOTATION_GAP],
    ['top-right', EXPORT_NOTATION_GAP, padding],
    ['bottom-right', EXPORT_NOTATION_GAP, padding],
  ])('keeps the gap to the diagram and the padding to the edge for a %s notation', (
    notationPosition,
    marginLeft,
    marginRight,
  ) => {
    const grid = exportPageGrid({ bounds, padding, description: false, notationPosition })

    expect(grid.notation).toMatchObject({ marginLeft, marginRight })
  })

  it('follows the padding of the export', () => {
    const grid = exportPageGrid({ bounds, padding: 8, description: false, notationPosition: 'bottom-left' })

    expect(grid.page.gridTemplateColumns).toBe(
      `${EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + 8}px ${bounds.width + 8 * 2 + EXPORT_EXTRA_PADDING}px`,
    )
    expect(grid.notation).toMatchObject({
      marginTop: 8,
      marginBottom: 8 + EXPORT_EXTRA_PADDING,
      marginLeft: 8,
    })
  })
})

describe('exportNotationShortTitle', () => {
  it('uses the text before the first colon', () => {
    expect(exportNotationShortTitle('Database: A specific container type: with details')).toBe('Database')
  })

  it.each([
    ['Software system', 'Software system'],
    [': starts with a colon', ': starts with a colon'],
    ['  Padded  ', 'Padded'],
  ])('falls back to the whole text for %j', (title, expected) => {
    expect(exportNotationShortTitle(title)).toBe(expected)
  })
})
