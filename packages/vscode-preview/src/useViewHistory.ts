import { hasAtLeast, type DiagramView } from '@likec4/core'
import { useRef } from 'react'

export function useViewHistory(view?: DiagramView | null) {
  const viewsHistoryRef = useRef<DiagramView[]>(view ? [view] : [])
  if (view) {
    const [head, prev] = viewsHistoryRef.current
    if (head && prev) {
      if (view.id === prev.id) {
        viewsHistoryRef.current.shift()
      } else if (view.id !== head.id) {
        viewsHistoryRef.current.unshift(view)
      }
      if (viewsHistoryRef.current.length > 20) {
        viewsHistoryRef.current.pop()
      }
    } else {
      if (!head || head.id !== view.id) {
        viewsHistoryRef.current.unshift(view)
      }
    }
  }
  return hasAtLeast(viewsHistoryRef.current, 2) ? viewsHistoryRef.current[1] : null
}
