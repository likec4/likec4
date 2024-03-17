import type { AutoLayoutDirection } from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { useNodesInitialized } from '@xyflow/react'
import { useRef } from 'react'
import { useXYFlow } from './hooks'

/**
 * Fits the view when the view changes and nodes are initialized
 */
export function FitviewOnDiagramChange({ viewId, layout }: { viewId: string; layout: AutoLayoutDirection }) {
  const xyflow = useXYFlow()
  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const viewLayout = viewId + '_' + layout
  const prevViewLayoutRef = useRef(viewLayout)

  useDebouncedEffect(
    () => {
      if (!nodeInitialized || prevViewLayoutRef.current === viewLayout) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.fitView({
        duration: 400,
        maxZoom: Math.max(1, zoom)
      })
      prevViewLayoutRef.current = viewLayout
    },
    [nodeInitialized, viewLayout],
    30,
    500
  )
  return null
}
