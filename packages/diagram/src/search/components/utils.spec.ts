import { describe, expect, it, vi } from 'vitest'
import { moveFocusToSearchInput } from './utils'

// Diagram tests run without a DOM, so use minimal stand-ins for the input and its root node
function setup(value: string) {
  const root = {
    activeElement: null as object | null,
    querySelector: vi.fn<(selector: string) => object>(() => input),
  }
  const input = {
    value,
    focus: vi.fn<() => void>(),
    setSelectionRange: vi.fn<(start: number, end: number) => void>(),
    getRootNode: () => root,
  }
  const button = {
    getRootNode: () => root,
  }
  return { root, input, button }
}

function asElement(fake: object): HTMLElement {
  return fake as HTMLElement
}

describe('moveFocusToSearchInput', () => {
  it('focuses the search input and moves the caret to the end', () => {
    const { root, input, button } = setup('abcdef')
    root.activeElement = button

    moveFocusToSearchInput(asElement(button))

    expect(root.querySelector).toHaveBeenCalledWith('[data-likec4-search-input]')
    expect(input.focus).toHaveBeenCalledOnce()
    expect(input.setSelectionRange).toHaveBeenCalledWith(6, 6)
  })

  it('keeps the caret and selection when the search input is already focused', () => {
    const { root, input } = setup('abcdef')
    root.activeElement = input

    moveFocusToSearchInput(asElement(input))

    expect(input.focus).not.toHaveBeenCalled()
    expect(input.setSelectionRange).not.toHaveBeenCalled()
  })
})
