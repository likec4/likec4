import { isFunction } from 'remeda'
import { focusable } from './_shared.css'

export function stopAndPrevent(e: React.KeyboardEvent | KeyboardEvent) {
  e.stopPropagation()
  e.preventDefault()
  return
}

export function centerY(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const y = rect.y + Math.floor(rect.height / 2)
  return y
}

export function moveFocusToSearchInput(from: HTMLElement | null | undefined) {
  if (!from) {
    console.error('moveFocusToSearchInput: from is null or undefined')
    return
  }
  const root = from.getRootNode() as Document | ShadowRoot
  if (!isFunction(root.querySelector)) {
    console.error('moveFocusToSearchInput: root.querySelector is not a function')
    return
  }
  let input = root.querySelector('[data-likec4-search-input]') as HTMLInputElement | null
  if (input) {
    const length = input.value.length
    input.focus()
    input.setSelectionRange(length, length)
  }
}

export function focusToFirstFoundElement(from: HTMLElement | null | undefined) {
  if (!from) {
    console.error('focusToFirstFoundElement: from is null or undefined')
    return
  }
  const root = from.getRootNode() as Document | ShadowRoot
  if (!isFunction(root.querySelector)) {
    console.error('focusToFirstFoundElement: root.querySelector is not a function')
    return
  }
  let firstFoundElement = root.querySelector<HTMLButtonElement>(`[data-likec4-search] .${focusable}`)
  firstFoundElement?.focus()
}

export function queryAllFocusable(
  from: HTMLElement | null | undefined,
  where: 'elements' | 'views',
  selector: string = `.${focusable}`,
): HTMLButtonElement[] {
  if (!from) {
    console.error('queryAllFocusable: from is null or undefined')
    return []
  }
  const root = from.getRootNode() as Document | ShadowRoot
  if (!isFunction(root.querySelectorAll)) {
    console.error('queryAllFocusable: root.querySelectorAll is not a function')
    return []
  }
  const elements = root.querySelectorAll<HTMLButtonElement>(`[data-likec4-search-${where}] ${selector}`)
  return [...elements]
}

/**
 * Workaround: defers execution of the callback, to finish search panel close animation.
 * Otherwise, there could be weird artifacts when navigating to large diagrams.
 * @todo Find a better way to handle this, possibly with animationend event.
 */
export function whenSearchAnimationEnds(
  callback: () => void,
): void {
  setTimeout(callback, 300)
}
