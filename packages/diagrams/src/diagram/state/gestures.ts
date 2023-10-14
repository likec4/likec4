let _isDragging = false
let tm: number | undefined

/**
 * Debounce the isDragging=false
 */
export const DiagramGesture = {
  get isDragging(): boolean {
    return _isDragging
  },
  set isDragging(value: boolean) {
    clearTimeout(tm)
    if (value) {
      _isDragging = value
      return
    }
    if (_isDragging) {
      tm = setTimeout(() => {
        _isDragging = false
      }, 100) as unknown as number
    }
  }
}
