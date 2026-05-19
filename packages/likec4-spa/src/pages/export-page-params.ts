// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

/**
 * Normalizes boolean export search params that can arrive from TanStack Router or URL strings.
 */
export function isExportSearchFlagEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}

/**
 * Normalizes an optional export background color from router search params.
 */
export function normalizeExportBackground(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/**
 * Checks whether an export background value should be treated as an opaque diagram background.
 */
export function hasSolidExportBackground(value: string | undefined): boolean {
  if (!value) {
    return false
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'transparent') {
    return false
  }
  if (/^#[\da-f]{4}$/i.test(normalized)) {
    return normalized[4] !== '0'
  }
  if (/^#[\da-f]{8}$/i.test(normalized)) {
    return normalized.slice(7) !== '00'
  }

  const colorFunctionMatch = normalized.match(/^[a-z][a-z0-9-]*\((.*)\)$/i)
  if (!colorFunctionMatch) {
    return true
  }

  const body = colorFunctionMatch[1] ?? ''
  const slashAlpha = body.match(/\/\s*([^)]+)$/)?.[1]
  const parts = body.split(',')
  const commaAlpha = parts.length === 4 ? parts.at(-1) : undefined
  const alpha = slashAlpha ?? commaAlpha
  return !alpha || !isZeroAlpha(alpha)
}

function isZeroAlpha(value: string): boolean {
  const normalized = value.trim()
  const numeric = normalized.endsWith('%') ? Number.parseFloat(normalized) / 100 : Number.parseFloat(normalized)
  return Number.isFinite(numeric) && numeric === 0
}
