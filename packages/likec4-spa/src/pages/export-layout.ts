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
 * Calculates the reserved height for the notation panel in exported images.
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
}: {
  bounds: BBox
  padding: number
  description: ExportDescriptionContent | null
  notationEntries: number
}): ExportPageLayout {
  const diagramWidth = bounds.width + padding * 2 + EXPORT_EXTRA_PADDING
  const diagramHeight = bounds.height + padding * 2 + EXPORT_EXTRA_PADDING
  const hasNotation = notationEntries > 0
  const width = hasNotation
    ? diagramWidth + EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + padding
    : diagramWidth
  const descriptionHeight = description ? exportDescriptionHeight({ ...description, width }) : 0
  const contentTop = descriptionHeight > 0 ? descriptionHeight + EXPORT_DESCRIPTION_GAP : 0
  const diagram = {
    left: 0,
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

  const notationHeight = exportNotationHeight(notationEntries)
  const contentHeight = Math.max(diagram.height, notationHeight + padding * 2)

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
      left: diagram.width + EXPORT_NOTATION_GAP,
      top: contentTop + padding,
      width: EXPORT_NOTATION_WIDTH,
      height: notationHeight,
    },
  }
}
