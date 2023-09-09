import { isString } from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web/esm'
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
    hashParams.set('likec4', viewId)
    window.location.hash = hashParams.toString()
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
  const [viewId, setStateViewId] = useState(initialViewId)

  const viewIdRef = useRef(viewId)
  const prevIdRef = useRef<ViewId>()

  if (viewIdRef.current !== viewId) {
    prevIdRef.current = viewIdRef.current
    viewIdRef.current = viewId
  }

  const onReturnRef = useRef(onReturnToInitial)
  onReturnRef.current = onReturnToInitial

  useDebouncedEffect(
    () => {
      writeViewId(initialViewId)
    },
    [initialViewId],
    300
  )

  useEffect(() => {
    const onHashChange = (ev: HashChangeEvent) => {
      const newViewId = readViewIdFromUrl(ev.newURL)
      if (newViewId === null) {
        // If we have any forwards, then we are going back
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
    window.addEventListener('hashchange', onHashChange, {
      capture: true
    })

    return () => {
      window.removeEventListener('hashchange', onHashChange, {
        capture: true
      })
      if (resetHashOnUnmount) {
        writeViewId(null)
      }
    }
  }, [initialViewId])

  const setViewId = useCallback((nextViewId: ViewId) => {
    if (isViewId(nextViewId) && nextViewId !== viewIdRef.current) {
      // setStateViewId(nextViewId)
      writeViewId(nextViewId)
    }
  }, [])

  return [viewId, setViewId] as [ViewId, typeof setViewId]
}
