let _isDragging = false
let tm: NodeJS.Timeout

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
      }, 100)
    }
  }
}
