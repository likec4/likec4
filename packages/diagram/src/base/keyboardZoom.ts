// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

export type KeyboardZoomAction = 'zoom-in' | 'zoom-out' | 'reset'

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}

export function getKeyboardZoomAction(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'target'>):
  | KeyboardZoomAction
  | null
{
  if ((!event.ctrlKey && !event.metaKey) || isEditableKeyboardTarget(event.target)) {
    return null
  }
  switch (event.key) {
    case '+':
    case '=':
      return 'zoom-in'
    case '-':
    case '_':
      return 'zoom-out'
    case '0':
      return 'reset'
    default:
      return null
  }
}
