import { useCallback, useEffect, useRef, useState } from 'react'
import type { LikeC4DiagramApi } from '../src'
import { LikeC4Diagram, type DiagramNode } from '../src'
import * as likec4 from './likec4'

function readViewId(initial: likec4.LikeC4ViewId = 'index') {
  let hash = window.location.hash
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  return likec4.isLikeC4ViewId(hash) ? hash : initial
}

function useViewId(initial: likec4.LikeC4ViewId) {
  const [viewId, setStateViewId] = useState(() => readViewId(initial))

  const viewIdRef = useRef(viewId)
  viewIdRef.current = viewId

  useEffect(() => {
    const onHashChange = (ev: HashChangeEvent) => {
      const newViewId = new URL(ev.newURL).hash.slice(1)
      if (likec4.isLikeC4ViewId(newViewId) && newViewId !== viewIdRef.current) {
        setStateViewId(newViewId)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const setViewId = useCallback((nextViewId: likec4.LikeC4ViewId) => {
    if (nextViewId !== viewIdRef.current) {
      window.location.hash = nextViewId
      setStateViewId(nextViewId)
    }
  }, [])

  return [viewId, setViewId] as const
}

export default function DevApp() {
  const [viewId, setViewId] = useViewId('index')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (likec4.isLikeC4ViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])

  const apiRef = useRef<LikeC4DiagramApi>(null)

  // useEffect(() => {
  //   console.log('DevApp: mount')
  //   return () => {
  //     console.log('DevApp: unmount')
  //     console.countReset('DevApp: render')
  //   }
  // }, [])

  // console.log('DevApp: viewId =', viewId)
  // console.count('DevApp: render')

  return (
    <LikeC4Diagram
      ref={apiRef}
      className='likec4-diagram'
      diagram={likec4.LikeC4ViewsData[viewId]}
      onNodeClick={onNodeClick}
      onStageClick={() => {
        apiRef.current?.centerAndFit()
      }}
      width={window.innerWidth}
      height={window.innerHeight}
      padding={40}
    />
  )
}
