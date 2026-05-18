// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

export type ChatWindowSize = {
  width: number
  height: number
}

export type ChatWindowResizeDelta = {
  width: number
  height: number
}

export const CHAT_WINDOW_VIEWPORT_PADDING = 16
export const CHAT_WINDOW_CONSTRAIN_OFFSET = 8

export const DEFAULT_CHAT_WINDOW_SIZE: ChatWindowSize = {
  width: 440,
  height: 420,
}

export const MIN_CHAT_WINDOW_SIZE: ChatWindowSize = {
  width: 320,
  height: 360,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function defaultMaxWindowSize(): ChatWindowSize {
  if (typeof window === 'undefined') {
    return DEFAULT_CHAT_WINDOW_SIZE
  }
  return {
    width: Math.max(MIN_CHAT_WINDOW_SIZE.width, window.innerWidth - CHAT_WINDOW_VIEWPORT_PADDING),
    height: Math.max(MIN_CHAT_WINDOW_SIZE.height, window.innerHeight - CHAT_WINDOW_VIEWPORT_PADDING),
  }
}

function defaultViewportSize(): ChatWindowSize {
  if (typeof window === 'undefined') {
    return DEFAULT_CHAT_WINDOW_SIZE
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export function maxChatWindowSizeForResize(
  rect: Pick<DOMRect, 'left' | 'top'>,
  viewport: ChatWindowSize = defaultViewportSize(),
): ChatWindowSize {
  return {
    width: Math.max(
      MIN_CHAT_WINDOW_SIZE.width,
      viewport.width - rect.left - CHAT_WINDOW_CONSTRAIN_OFFSET,
    ),
    height: Math.max(
      MIN_CHAT_WINDOW_SIZE.height,
      viewport.height - rect.top - CHAT_WINDOW_CONSTRAIN_OFFSET,
    ),
  }
}

export function resizeChatWindowSize(
  size: ChatWindowSize,
  delta: ChatWindowResizeDelta,
  maxSize = defaultMaxWindowSize(),
): ChatWindowSize {
  return {
    width: clamp(size.width + delta.width, MIN_CHAT_WINDOW_SIZE.width, maxSize.width),
    height: clamp(size.height + delta.height, MIN_CHAT_WINDOW_SIZE.height, maxSize.height),
  }
}
