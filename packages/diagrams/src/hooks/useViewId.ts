import { isString } from '@likec4/core'
import { useCallback, useEffect, useRef, useState } from 'react'

function readViewId(hash = window.location.hash): string | null {
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  if (hash.includes('likec4')) {
    return new URLSearchParams(hash).get('likec4')
  }
  return null
}
function writeViewId(viewId: string) {
  let hash = window.location.hash
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  const hashParams = new URLSearchParams(hash)
  hashParams.set('likec4', viewId)
  window.location.hash = hashParams.toString()
}

const noopIsViewId = <T>(value: unknown): value is T => isString(value) && value.length > 0

export function useViewId<ViewId extends string>({
  initialViewId,
  isViewId = noopIsViewId
}: {
  initialViewId: ViewId
  isViewId?: (value: unknown) => value is ViewId
}) {
  const [viewId, setStateViewId] = useState(initialViewId)

  useEffect(() => {
    writeViewId(initialViewId)
  }, [])

  const viewIdRef = useRef(viewId)
  viewIdRef.current = viewId

  useEffect(() => {
    const onHashChange = (ev: HashChangeEvent) => {
      const newViewId = readViewId(new URL(ev.newURL).hash)
      if (isViewId(newViewId) && newViewId !== viewIdRef.current) {
        setStateViewId(newViewId)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const setViewId = useCallback((nextViewId: ViewId) => {
    if (nextViewId !== viewIdRef.current) {
      writeViewId(nextViewId)
      setStateViewId(nextViewId)
    }
  }, [])

  return [viewId, setViewId] as [ViewId, typeof setViewId]
}
