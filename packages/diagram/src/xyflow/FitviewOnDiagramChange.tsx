import { useDebouncedEffect } from '@react-hookz/web'
import { useNodesInitialized } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { memo, useRef } from 'react'
import { useDiagramStateTracked } from '../state'
import { MinZoom } from './const'
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
  const viewLayout = state.viewId + '_' + state.viewLayout + '_' + state.fitViewPadding
  const prevViewLayoutRef = useRef(viewLayout)
  const isReady = nodeInitialized && xyflow.viewportInitialized

  useDebouncedEffect(
    () => {
      if (!isReady || prevViewLayoutRef.current === viewLayout) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.setCenter(state.viewWidth / 2, state.viewHeight / 2, {
        duration: 150,
        zoom
      })
      xyflow.fitView({
        duration: 350,
        padding: state.fitViewPadding,
        minZoom: MinZoom,
        maxZoom: Math.max(1, zoom)
      })
      updateState({ viewportMoved: false })
      prevViewLayoutRef.current = viewLayout
    },
    [isReady, viewLayout],
    50
  )

  return null

  // TODO: listen to resize event
  // return <div className={clsx('react-flow__panel')}></div>
}, shallowEqual)
