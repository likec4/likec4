import { useDebouncedEffect } from '@react-hookz/web'
import { type ReactFlowState, useNodesInitialized, useStore } from '@xyflow/react'
import { useRef } from 'react'
import { useDiagramState, useDiagramStateTracked } from '../state'
import { MinZoom } from './const'
import { useXYFlow } from './hooks'

function selectDimensions(state: ReactFlowState) {
  return `${state.width}:${state.height}`
}

function FitViewOnViewportResize() {
  const fitViewPadding = useDiagramState().fitViewPadding
  const dimensions = useStore(selectDimensions)
  const prevDimensionsRef = useRef(dimensions)
  const xyflow = useXYFlow()

  useDebouncedEffect(
    () => {
      if (prevDimensionsRef.current === dimensions) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.fitView({
        duration: 350,
        padding: fitViewPadding,
        minZoom: MinZoom,
        maxZoom: Math.max(1, zoom)
      })
      prevDimensionsRef.current = dimensions
    },
    [dimensions, fitViewPadding],
    150
  )

  return null
}

/**
 * Fits the view when the view changes and nodes are initialized
 */
export function FitViewOnDiagramChange() {
  const [state, updateState] = useDiagramStateTracked()
  const xyflow = useXYFlow()
  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const isReady = nodeInitialized && xyflow.viewportInitialized

  const viewLayout = state.viewId + '_' + state.viewLayout + '_' + state.fitViewPadding
  const prevViewLayoutRef = useRef(viewLayout)

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

  if (!state.viewportMoved) {
    return <FitViewOnViewportResize />
  }

  return null

  // TODO: listen to resize event
  // return <div className={clsx('react-flow__panel')}></div>
}
