import { useCallback, useEffect, useRef, useState } from 'react'
import type { LikeC4ViewId, DiagramNode, DiagramApi } from './likec4'
import { Diagram, isViewId } from './likec4'

function readViewId(initial: LikeC4ViewId = 'index'): LikeC4ViewId {
  let hash = window.location.hash
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  return isViewId(hash) ? hash : initial
}

function useViewId(initial: LikeC4ViewId) {
  const [viewId, setStateViewId] = useState(() => readViewId(initial))

  const viewIdRef = useRef(viewId)
  viewIdRef.current = viewId

  useEffect(() => {
    const onHashChange = (ev: HashChangeEvent) => {
      const newViewId = new URL(ev.newURL).hash.slice(1)
      if (isViewId(newViewId) && newViewId !== viewIdRef.current) {
        setStateViewId(newViewId)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const setViewId = useCallback((nextViewId: LikeC4ViewId) => {
    if (nextViewId !== viewIdRef.current) {
      window.location.hash = nextViewId
      setStateViewId(nextViewId)
    }
  }, [])

  return [viewId, setViewId] as [LikeC4ViewId, typeof setViewId]
}

export default function DevApp() {
  const [viewId, setViewId] = useViewId('index')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (isViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])

  const apiRef = useRef<DiagramApi>(null)

  return (
    // <div className='dev-app'>
    <Diagram
      ref={apiRef}
      viewId={viewId}
      width={window.innerWidth}
      height={window.innerHeight}
      onNodeClick={onNodeClick}
      padding={50}
    />
    // </div>
  )
}
