import { type LikeC4ViewId, LikeC4View } from 'likec4:react/index-page'
import { useEffect, useState } from 'react'

export function DemoDiagram({ viewId: initialViewId }: { viewId: LikeC4ViewId }) {
  const [viewId, setViewId] = useState<LikeC4ViewId>(initialViewId)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ viewId: LikeC4ViewId }>).detail
      setViewId(detail.viewId)
    }
    window.addEventListener('demo-view-change', handler)
    return () => window.removeEventListener('demo-view-change', handler)
  }, [])

  return <LikeC4View viewId={viewId} className="likec4-demo-view" />
}
