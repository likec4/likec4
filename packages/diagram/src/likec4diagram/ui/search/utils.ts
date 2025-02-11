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

export function moveFocusToSearchInput() {
  const input = document.getElementById('likec4searchinput') as HTMLInputElement | null
  if (input) {
    const length = input.value.length
    input.focus()
    input.setSelectionRange(length, length)
  }
}
