// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

// Common reasoning tag pairs used by various models (matching Open WebUI's defaults)
export const REASONING_TAG_PAIRS: Array<[open: string, close: string]> = [
  ['<think>', '</think>'],
  ['<thinking>', '</thinking>'],
  ['<reason>', '</reason>'],
  ['<reasoning>', '</reasoning>'],
  ['<thought>', '</thought>'],
  ['<|begin_of_thought|>', '<|end_of_thought|>'],
]

// Precompute the longest tag for buffer sizing
export const MAX_TAG_LENGTH = Math.max(...REASONING_TAG_PAIRS.flatMap(([o, c]) => [o.length, c.length]))

export function findOpenTag(text: string): { index: number; tag: string; closeTag: string } | null {
  let best: { index: number; tag: string; closeTag: string } | null = null
  for (const [open, close] of REASONING_TAG_PAIRS) {
    const idx = text.indexOf(open)
    if (idx !== -1 && (best === null || idx < best.index)) {
      best = { index: idx, tag: open, closeTag: close }
    }
  }
  return best
}

export interface ReasoningTagCallbacks {
  onContent: (text: string) => void
  onReasoning: (text: string) => void
}

/**
 * Stateful parser that processes streaming tokens and separates content from reasoning tags.
 * Handles partial tags at chunk boundaries by buffering.
 */
export class ReasoningTagParser {
  private insideReasoningTag = false
  private activeCloseTag = ''
  private tagBuffer = ''

  constructor(private callbacks: ReasoningTagCallbacks) {}

  /** Process an incoming content token */
  process(token: string): void {
    this.tagBuffer += token

    while (this.tagBuffer.length > 0) {
      if (this.insideReasoningTag) {
        const closeIdx = this.tagBuffer.indexOf(this.activeCloseTag)
        if (closeIdx !== -1) {
          const chunk = this.tagBuffer.slice(0, closeIdx)
          if (chunk) {
            this.callbacks.onReasoning(chunk)
          }
          this.tagBuffer = this.tagBuffer.slice(closeIdx + this.activeCloseTag.length)
          this.insideReasoningTag = false
          this.activeCloseTag = ''
        } else if (this.tagBuffer.length > MAX_TAG_LENGTH) {
          const safe = this.tagBuffer.slice(0, this.tagBuffer.length - MAX_TAG_LENGTH + 1)
          this.tagBuffer = this.tagBuffer.slice(safe.length)
          this.callbacks.onReasoning(safe)
        } else {
          break
        }
      } else {
        const match = findOpenTag(this.tagBuffer)
        if (match) {
          const chunk = this.tagBuffer.slice(0, match.index)
          if (chunk) {
            this.callbacks.onContent(chunk)
          }
          this.tagBuffer = this.tagBuffer.slice(match.index + match.tag.length)
          this.insideReasoningTag = true
          this.activeCloseTag = match.closeTag
        } else if (this.tagBuffer.length > MAX_TAG_LENGTH) {
          const safe = this.tagBuffer.slice(0, this.tagBuffer.length - MAX_TAG_LENGTH + 1)
          this.tagBuffer = this.tagBuffer.slice(safe.length)
          this.callbacks.onContent(safe)
        } else {
          break
        }
      }
    }
  }

  /** Flush any remaining buffered content and reset parser state */
  flush(): void {
    if (this.tagBuffer.length > 0) {
      if (this.insideReasoningTag) {
        this.callbacks.onReasoning(this.tagBuffer)
      } else {
        this.callbacks.onContent(this.tagBuffer)
      }
      this.tagBuffer = ''
    }
    this.insideReasoningTag = false
    this.activeCloseTag = ''
  }
}
