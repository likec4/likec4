// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { BBox } from '@likec4/core/types'

export const EXPORT_EXTRA_PADDING = 16
export const EXPORT_DESCRIPTION_GAP = 16
export const EXPORT_DESCRIPTION_INSET = 16
export const EXPORT_DESCRIPTION_MIN_HEIGHT = 84
export const EXPORT_DESCRIPTION_MAX_HEIGHT = 240
export const EXPORT_NOTATION_GAP = 24
export const EXPORT_NOTATION_WIDTH = 320
export const EXPORT_NOTATION_INSET = 12
export const EXPORT_NOTATION_HEADER_HEIGHT = 36
export const EXPORT_NOTATION_ITEM_HEIGHT = 68

export const EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT = 20
const EXPORT_DESCRIPTION_BODY_LINE_HEIGHT = 19
export const EXPORT_DESCRIPTION_TOP_PADDING = 10
export const EXPORT_DESCRIPTION_BODY_TOP_GAP = 4
export const EXPORT_DESCRIPTION_BOTTOM_PADDING = 16
const EXPORT_DESCRIPTION_AVERAGE_CHARACTER_WIDTH = 7.5

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
 * Text content shown in the optional description panel of an exported image.
 */
export type ExportDescriptionContent = {
  title: string
  text: string
}

/**
 * Pixel bounds reserved for each area of the export canvas.
 */
export type ExportPageLayout = {
  width: number
  height: number
  diagram: {
    left: number
    top: number
    width: number
    height: number
  }
  description: {
    left: number
    top: number
    width: number
    height: number
  } | null
  notation: {
    left: number
    top: number
    width: number
    height: number
  } | null
}

/**
 * Estimates the reserved height for the notation panel in exported images.
 * Used until the rendered panel has been measured.
 */
export function exportNotationHeight(entries: number): number {
  return EXPORT_NOTATION_INSET * 2 + EXPORT_NOTATION_HEADER_HEIGHT + entries * EXPORT_NOTATION_ITEM_HEIGHT
}

/**
 * Estimates the description panel height for exported images and clamps it to export-friendly bounds.
 */
export function exportDescriptionHeight({
  title,
  text,
  width,
}: ExportDescriptionContent & {
  width: number
}): number {
  const availableWidth = Math.max(80, width - EXPORT_DESCRIPTION_INSET * 2)
  const charactersPerLine = Math.max(12, Math.floor(availableWidth / EXPORT_DESCRIPTION_AVERAGE_CHARACTER_WIDTH))
  const titleLines = title.trim().length > 0 ? 1 : 0
  const bodyLines = estimateWrappedLines(text, charactersPerLine)
  const bodyTopGap = bodyLines > 0 ? EXPORT_DESCRIPTION_BODY_TOP_GAP : 0
  const preferredHeight = EXPORT_DESCRIPTION_TOP_PADDING
    + titleLines * EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT
    + bodyTopGap
    + bodyLines * EXPORT_DESCRIPTION_BODY_LINE_HEIGHT
    + EXPORT_DESCRIPTION_BOTTOM_PADDING

  return Math.min(
    EXPORT_DESCRIPTION_MAX_HEIGHT,
    Math.max(EXPORT_DESCRIPTION_MIN_HEIGHT, Math.ceil(preferredHeight)),
  )
}

/**
 * Estimates wrapped text lines from plain text using an average character width.
 */
function estimateWrappedLines(text: string, charactersPerLine: number): number {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  if (lines.length === 0) {
    return 0
  }
  return lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0)
}

/**
 * Computes the export canvas size and non-overlapping bounds for the diagram, description, and notation areas.
 */
export function computeExportPageLayout({
  bounds,
  padding,
  description,
  notationEntries,
  notationHeight,
  notationPosition = DEFAULT_EXPORT_NOTATION_POSITION,
}: {
  bounds: BBox
  padding: number
  description: ExportDescriptionContent | null
  notationEntries: number
  /** Measured height of the rendered notation panel; estimated from `notationEntries` when omitted. */
  notationHeight?: number | undefined
  notationPosition?: ExportNotationPosition | undefined
}): ExportPageLayout {
  const diagramWidth = bounds.width + padding * 2 + EXPORT_EXTRA_PADDING
  const diagramHeight = bounds.height + padding * 2 + EXPORT_EXTRA_PADDING
  const hasNotation = notationEntries > 0
  const notationOnLeft = notationPosition === 'top-left' || notationPosition === 'bottom-left'
  const width = hasNotation
    ? diagramWidth + EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + padding
    : diagramWidth
  const descriptionHeight = description ? exportDescriptionHeight({ ...description, width }) : 0
  const contentTop = descriptionHeight > 0 ? descriptionHeight + EXPORT_DESCRIPTION_GAP : 0
  const diagram = {
    left: hasNotation && notationOnLeft ? padding + EXPORT_NOTATION_WIDTH + EXPORT_NOTATION_GAP : 0,
    top: contentTop,
    width: diagramWidth,
    height: diagramHeight,
  }

  if (!hasNotation) {
    return {
      width,
      height: contentTop + diagram.height,
      diagram,
      description: description
        ? {
          left: 0,
          top: 0,
          width,
          height: descriptionHeight,
        }
        : null,
      notation: null,
    }
  }

  const panelHeight = notationHeight ?? exportNotationHeight(notationEntries)
  const contentHeight = Math.max(diagram.height, panelHeight + padding * 2)
  // Bottom corners align the panel with the bottom edge of the drawn diagram (above the extra padding)
  const notationTop = notationPosition === 'top-left' || notationPosition === 'top-right'
    ? contentTop + padding
    : contentTop + Math.max(bounds.height + padding, panelHeight + padding) - panelHeight

  return {
    width,
    height: contentTop + contentHeight,
    diagram,
    description: description
      ? {
        left: 0,
        top: 0,
        width,
        height: descriptionHeight,
      }
      : null,
    notation: {
      left: notationOnLeft ? padding : diagram.width + EXPORT_NOTATION_GAP,
      top: notationTop,
      width: EXPORT_NOTATION_WIDTH,
      height: panelHeight,
    },
  }
}
