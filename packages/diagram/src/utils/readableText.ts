// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type MarkdownOrString, RichText } from '@likec4/core'

const WHITESPACE = /\s+/g

/**
 * Flattens a markdown or plain string value into a single line of
 * screen-reader friendly text: renders markdown to plain text, collapses
 * runs of whitespace and trims. Returns `null` when the value yields no text.
 *
 * Use this whenever model text (titles, labels, descriptions, notes) is
 * surfaced to assistive technologies, so that markdown syntax and stray
 * whitespace never leak into an `aria-label`.
 */
export function readableText(value: MarkdownOrString | string | null | undefined): string | null {
  return RichText.from(value).text?.replace(WHITESPACE, ' ').trim() || null
}
