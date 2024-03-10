import { useDebouncedEffect } from '@react-hookz/web'
import { useNodesInitialized } from '@xyflow/react'
import { useRef } from 'react'
import { useXYFlow } from './hooks'

/**
 * Fits the view when the view changes and nodes are initialized
 */
export function UpdateViewportOnDiagramChange({ viewId }: { viewId: string }) {
  const xyflow = useXYFlow()
  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const prevViewIdRef = useRef(viewId)

  useDebouncedEffect(
    () => {
      if (!nodeInitialized || prevViewIdRef.current === viewId) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.fitView({
        duration: 400,
        maxZoom: Math.max(1, zoom)
      })
      prevViewIdRef.current = viewId
    },
    [nodeInitialized, viewId],
    30
  )
  return null
}
