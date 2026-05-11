// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { BBox } from '@likec4/core/types'

export const EXPORT_EXTRA_PADDING = 16
export const EXPORT_NOTATION_GAP = 24
export const EXPORT_NOTATION_WIDTH = 320
export const EXPORT_NOTATION_INSET = 12
export const EXPORT_NOTATION_HEADER_HEIGHT = 36
export const EXPORT_NOTATION_ITEM_HEIGHT = 68

export type ExportPageLayout = {
  width: number
  height: number
  diagram: {
    width: number
    height: number
  }
  notation: {
    left: number
    top: number
    width: number
    height: number
  } | null
}

export function exportNotationHeight(entries: number): number {
  return EXPORT_NOTATION_INSET * 2 + EXPORT_NOTATION_HEADER_HEIGHT + entries * EXPORT_NOTATION_ITEM_HEIGHT
}

export function computeExportPageLayout({
  bounds,
  padding,
  notationEntries,
}: {
  bounds: BBox
  padding: number
  notationEntries: number
}): ExportPageLayout {
  const diagram = {
    width: bounds.width + padding * 2 + EXPORT_EXTRA_PADDING,
    height: bounds.height + padding * 2 + EXPORT_EXTRA_PADDING,
  }

  if (notationEntries <= 0) {
    return {
      width: diagram.width,
      height: diagram.height,
      diagram,
      notation: null,
    }
  }

  const notationHeight = exportNotationHeight(notationEntries)
  const height = Math.max(diagram.height, notationHeight + padding * 2)

  return {
    width: diagram.width + EXPORT_NOTATION_GAP + EXPORT_NOTATION_WIDTH + padding,
    height,
    diagram,
    notation: {
      left: diagram.width + EXPORT_NOTATION_GAP,
      top: padding,
      width: EXPORT_NOTATION_WIDTH,
      height: notationHeight,
    },
  }
}
