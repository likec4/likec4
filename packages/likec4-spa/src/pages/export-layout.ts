// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { BBox } from '@likec4/core/types'
import type { CSSProperties } from 'react'

export const EXPORT_EXTRA_PADDING = 16
export const EXPORT_DESCRIPTION_GAP = 16
export const EXPORT_DESCRIPTION_INSET = 16
export const EXPORT_DESCRIPTION_MIN_HEIGHT = 84
export const EXPORT_DESCRIPTION_MAX_HEIGHT = 240
export const EXPORT_NOTATION_GAP = 24
export const EXPORT_NOTATION_WIDTH = 320

export const EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT = 20
export const EXPORT_DESCRIPTION_TOP_PADDING = 10
export const EXPORT_DESCRIPTION_BODY_TOP_GAP = 4
export const EXPORT_DESCRIPTION_BOTTOM_PADDING = 16

/**
 * Corners of the export canvas the notation panel can be aligned to.
 * The panel is placed in a column beside the diagram, so it never covers diagram elements.
 */
export const ExportNotationPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
export type ExportNotationPosition = typeof ExportNotationPositions[number]
export const DEFAULT_EXPORT_NOTATION_POSITION: ExportNotationPosition = 'bottom-right'

/**
 * How each notation entry is labelled in exported images:
 * - `short`: the notation text before the first `:` (the whole text if there is none)
 * - `full`: the complete notation text, wrapped
 * - `kind`: only the element kinds
 */
export const ExportNotationTexts = ['short', 'full', 'kind'] as const
export type ExportNotationText = typeof ExportNotationTexts[number]
export const DEFAULT_EXPORT_NOTATION_TEXT: ExportNotationText = 'short'

/**
 * Returns the short legend title of a notation, i.e. the text before the first `:`.
 * Falls back to the whole (trimmed) text when there is no `:` or nothing precedes it.
 */
export function exportNotationShortTitle(title: string): string {
  const separator = title.indexOf(':')
  const short = separator > 0 ? title.slice(0, separator).trim() : ''
  return short.length > 0 ? short : title.trim()
}

/**
 * CSS grid of the export canvas.
 *
 * Only the diagram area has a fixed size, derived from the view bounds. The description and
 * notation panels take the height of their content, and the browser sizes the canvas around them.
 * The CLI screenshots the canvas at whatever size it ends up with.
 */
export type ExportPageGrid = {
  /** Grid container: the export canvas */
  page: CSSProperties
  /** Diagram area, fixed to the view bounds plus padding */
  diagram: CSSProperties
  /** Description panel above the diagram and the notation, `null` when hidden */
  description: CSSProperties | null
  /** Notation panel beside the diagram, `null` when hidden */
  notation: CSSProperties | null
}

/**
 * Computes the CSS grid that places the diagram, the description and the notation panel.
 *
 * - Without panels the canvas is exactly the diagram area.
 * - The description spans the full width above everything else, between its minimum and maximum height.
 * - The notation gets its own column on the left or right of the diagram, so it never covers diagram elements.
 *   Top corners align it with the top padding of the diagram, bottom corners with the bottom edge of the drawn
 *   diagram (above the extra padding).
 */
export function exportPageGrid({
  bounds,
  padding,
  description,
  notationPosition,
}: {
  bounds: Pick<BBox, 'width' | 'height'>
  padding: number
  /** Whether the description panel is shown */
  description: boolean
  /** Corner of the notation panel, `null` when it is hidden */
  notationPosition: ExportNotationPosition | null
}): ExportPageGrid {
  const diagramWidth = bounds.width + padding * 2 + EXPORT_EXTRA_PADDING
  const diagramHeight = bounds.height + padding * 2 + EXPORT_EXTRA_PADDING
  // Fixed, so that the description (which spans all columns) cannot widen the canvas
  const notationColumnWidth = EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + padding
  const notationOnLeft = notationPosition === 'top-left' || notationPosition === 'bottom-left'
  const notationAtBottom = notationPosition === 'bottom-left' || notationPosition === 'bottom-right'

  let columns: string
  let contentAreas: string
  switch (true) {
    case notationPosition === null:
      columns = `${diagramWidth}px`
      contentAreas = '"diagram"'
      break
    case notationOnLeft:
      columns = `${notationColumnWidth}px ${diagramWidth}px`
      contentAreas = '"notation diagram"'
      break
    default:
      columns = `${diagramWidth}px ${notationColumnWidth}px`
      contentAreas = '"diagram notation"'
  }
  const descriptionAreas = notationPosition === null ? '"description"' : '"description description"'

  return {
    page: {
      display: 'grid',
      gridTemplateColumns: columns,
      gridTemplateRows: description ? 'auto auto' : 'auto',
      gridTemplateAreas: description ? `${descriptionAreas} ${contentAreas}` : contentAreas,
    },
    diagram: {
      gridArea: 'diagram',
      position: 'relative',
      overflow: 'hidden',
      width: diagramWidth,
      minHeight: diagramHeight,
    },
    description: description
      ? {
        gridArea: 'description',
        boxSizing: 'border-box',
        minHeight: EXPORT_DESCRIPTION_MIN_HEIGHT,
        maxHeight: EXPORT_DESCRIPTION_MAX_HEIGHT,
        marginBottom: EXPORT_DESCRIPTION_GAP,
      }
      : null,
    notation: notationPosition !== null
      ? {
        gridArea: 'notation',
        alignSelf: notationAtBottom ? 'end' : 'start',
        boxSizing: 'border-box',
        width: EXPORT_NOTATION_WIDTH,
        marginTop: padding,
        // Bottom corners keep the extra padding below the panel, like below the drawn diagram
        marginBottom: notationAtBottom ? padding + EXPORT_EXTRA_PADDING : padding,
        marginLeft: notationOnLeft ? padding : EXPORT_NOTATION_GAP,
        marginRight: notationOnLeft ? EXPORT_NOTATION_GAP : padding,
      }
      : null,
  }
}
