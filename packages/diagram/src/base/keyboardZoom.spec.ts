// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getKeyboardZoomAction, isEditableKeyboardTarget } from './keyboardZoom'

const hadHTMLElement = 'HTMLElement' in globalThis
const hadDocument = 'document' in globalThis
const originalHTMLElement = globalThis.HTMLElement
const originalDocument = globalThis.document

class TestHTMLElement extends EventTarget {
  public isContentEditable = false

  constructor(public readonly tagName: string) {
    super()
  }

  public set contentEditable(value: string) {
    this.isContentEditable = value === 'true'
  }
}

beforeAll(() => {
  Object.assign(globalThis, {
    HTMLElement: TestHTMLElement,
    document: {
      body: new TestHTMLElement('body'),
      createElement: (tagName: string) => new TestHTMLElement(tagName),
    },
  })
})

afterAll(() => {
  if (hadHTMLElement) {
    globalThis.HTMLElement = originalHTMLElement
  } else {
    Reflect.deleteProperty(globalThis, 'HTMLElement')
  }

  if (hadDocument) {
    globalThis.document = originalDocument
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

function event(key: string, target: EventTarget | null = document.body): Pick<
  KeyboardEvent,
  'key' | 'ctrlKey' | 'metaKey' | 'target'
> {
  return {
    key,
    ctrlKey: true,
    metaKey: false,
    target,
  }
}

describe('keyboard zoom helpers', () => {
  it('maps ctrl/meta zoom shortcuts to actions', () => {
    expect(getKeyboardZoomAction(event('+'))).toBe('zoom-in')
    expect(getKeyboardZoomAction(event('='))).toBe('zoom-in')
    expect(getKeyboardZoomAction(event('-'))).toBe('zoom-out')
    expect(getKeyboardZoomAction(event('_'))).toBe('zoom-out')
    expect(getKeyboardZoomAction(event('0'))).toBe('reset')
    expect(getKeyboardZoomAction({
      key: '+',
      ctrlKey: false,
      metaKey: true,
      target: document.body,
    })).toBe('zoom-in')
  })

  it('ignores non-modified and unrelated keys', () => {
    expect(getKeyboardZoomAction({
      key: '+',
      ctrlKey: false,
      metaKey: false,
      target: document.body,
    })).toBeNull()
    expect(getKeyboardZoomAction(event('k'))).toBeNull()
  })

  it('detects editable keyboard targets', () => {
    const input = document.createElement('input')
    const select = document.createElement('select')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    editable.contentEditable = 'true'

    expect(isEditableKeyboardTarget(input)).toBe(true)
    expect(isEditableKeyboardTarget(select)).toBe(true)
    expect(isEditableKeyboardTarget(textarea)).toBe(true)
    expect(isEditableKeyboardTarget(editable)).toBe(true)
    expect(isEditableKeyboardTarget(document.createElement('button'))).toBe(false)
  })

  it('does not map shortcuts from editable targets', () => {
    const input = document.createElement('input')

    expect(getKeyboardZoomAction(event('+', input))).toBeNull()
  })
})
