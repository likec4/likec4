import type { AutoLayoutDirection } from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { useNodesInitialized, ViewportPortal } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { memo, useEffect, useRef } from 'react'
import useTilg from 'tilg'
import { useDiagramState, useDiagramStateTracked } from '../state'
import { useXYFlow } from './hooks'

/**
 * Fits the view when the view changes and nodes are initialized
 */
export const FitviewOnDiagramChange = memo(function FitViewOnDiagramChange() {
  const [state, updateState] = useDiagramStateTracked()
  const xyflow = useXYFlow()
  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const viewLayout = state.viewId + '_' + state.viewLayout
  const prevViewLayoutRef = useRef(viewLayout)

  const isReady = nodeInitialized && xyflow.viewportInitialized

  useDebouncedEffect(
    () => {
      if (!isReady || prevViewLayoutRef.current === viewLayout) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.fitView({
        duration: 400,
        maxZoom: Math.max(1, zoom)
      })
      updateState({ viewportMoved: false })
      prevViewLayoutRef.current = viewLayout
    },
    [isReady, viewLayout],
    50,
    600
  )

  return null

  // TODO: listen to resize event
  // return <div className={clsx('react-flow__panel')}></div>
}, shallowEqual)
