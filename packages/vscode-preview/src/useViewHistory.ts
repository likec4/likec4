import { type DiagramView, hasAtLeast } from '@likec4/core'
import { useEffect, useRef } from 'react'

export function useViewHistory(view?: DiagramView | null) {
  const viewsHistoryRef = useRef<DiagramView[]>(view ? [view] : [])
  if (view) {
    const [head, prev] = viewsHistoryRef.current
    if (head && prev) {
      if (view.id === prev.id) {
        viewsHistoryRef.current.shift()
      } else if (view.id === head.id) {
        viewsHistoryRef.current[0] = view
      } else if (view.id !== head.id) {
        viewsHistoryRef.current.unshift(view)
      }
      if (viewsHistoryRef.current.length > 20) {
        viewsHistoryRef.current.pop()
      }
    } else {
      if (!head) {
        viewsHistoryRef.current.unshift(view)
      } else if (head.id !== view.id) {
        viewsHistoryRef.current.unshift(view)
      } else {
        viewsHistoryRef.current[0] = view
      }
    }
  }
  return hasAtLeast(viewsHistoryRef.current, 2) ? viewsHistoryRef.current[1] : null
}
