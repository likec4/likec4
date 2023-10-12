import { isString } from '@likec4/core'
import { useCallback, useEffect, useRef, useState } from 'react'

function readViewIdFromUrl(url: string): string | null {
  return readViewId(new URL(url).hash)
}

function readViewId(hash = window.location.hash): string | null {
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  if (hash.includes('likec4')) {
    return new URLSearchParams(hash).get('likec4')
  }
  return null
}
function writeViewId(viewId: string | null) {
  let hash = window.location.hash
  if (hash.startsWith('#')) {
    hash = hash.slice(1)
  }
  const hashParams = new URLSearchParams(hash)
  if (viewId != null) {
    if (hashParams.get('likec4') !== viewId) {
      hashParams.set('likec4', viewId)
      window.location.hash = hashParams.toString()
    }
    return
  }
  if (viewId === null && hashParams.has('likec4')) {
    hashParams.delete('likec4')
    window.location.hash = hashParams.toString()
    return
  }
}

const noopIsViewId = <T>(value: unknown): value is T => isString(value) && value.length > 0

export function useViewIdFromHash<ViewId extends string>({
  initialViewId,
  onReturnToInitial,
  resetHashOnUnmount = true,
  isViewId = noopIsViewId
}: {
  initialViewId: ViewId
  resetHashOnUnmount?: boolean
  onReturnToInitial?: () => void
  isViewId?: (value: unknown) => value is ViewId
}) {
  const [viewId, setStateViewId] = useState(() => {
    const id = readViewId()
    // either from HASH or from props
    return isViewId(id) ? id : initialViewId
  })

  const viewIdRef = useRef(viewId)
  const prevIdRef = useRef<ViewId>()

  if (viewIdRef.current !== viewId) {
    prevIdRef.current = viewIdRef.current
    viewIdRef.current = viewId
  }

  const onReturnRef = useRef(onReturnToInitial)
  onReturnRef.current = onReturnToInitial

  // Write initial view id to HASH
  useEffect(() => {
    const tm = setTimeout(() => {
      writeViewId(viewIdRef.current)
    }, 300)
    return () => clearTimeout(tm)
  }, [])

  useEffect(() => {
    const onHashChange = (ev: HashChangeEvent) => {
      const newViewId = readViewIdFromUrl(ev.newURL)
      if (newViewId === null) {
        // If we had viewId on old URL, but not on new URL - we returned to initial
        const oldViewId = readViewIdFromUrl(ev.oldURL)
        if (oldViewId != null && onReturnRef.current) {
          onReturnRef.current?.()
        }
        return
      }
      if (isViewId(newViewId) && newViewId !== viewIdRef.current) {
        setStateViewId(newViewId)
      }
    }
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.removeEventListener('hashchange', onHashChange)
      if (resetHashOnUnmount) {
        writeViewId(null)
      }
    }
  }, [])

  const setViewId = useCallback((nextViewId: ViewId) => {
    if (isViewId(nextViewId) && nextViewId !== viewIdRef.current) {
      // setStateViewId(nextViewId)
      writeViewId(nextViewId)
    }
  }, [])

  return [viewId, setViewId] as [ViewId, typeof setViewId]
}
