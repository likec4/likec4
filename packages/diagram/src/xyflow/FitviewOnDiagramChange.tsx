import { useDebouncedEffect } from '@react-hookz/web'
import { type ReactFlowState, useNodesInitialized, useStore } from '@xyflow/react'
import { memo, useRef } from 'react'
import { type DiagramState, useDiagramStore, useDiagramStoreApi } from '../store'
import { MinZoom } from './const'
import { useXYFlow, useXYStore, useXYStoreApi } from './hooks'
import type { XYFlowState } from './types'

function selector(state: XYFlowState) {
  return {
    dimensions: `${Math.round(state.width)}:${Math.round(state.height)}`,
    zoom: state.transform[2],
    fitView: state.fitView
  }
}

function FitViewOnViewportResize() {
  const fitViewPadding = useDiagramStore(s => s.fitViewPadding)
  const {
    dimensions,
    zoom,
    fitView
  } = useXYStore(selector)
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      if (prevDimensionsRef.current === dimensions) {
        return
      }
      fitView({
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

// Compare this snippet from
// https://github.com/xyflow/xyflow/blob/a6c0bdc86309e023f29461d0c0a857aff3bc2c0e/packages/react/src/hooks/useNodesInitialized.ts
const areNodesInitialized = (s: XYFlowState) => {
  if (s.nodeLookup.size === 0) {
    return false
  }
  for (const [, node] of s.nodeLookup) {
    if (node.internals.handleBounds === undefined) {
      return false
    }
  }
  return true
}

const select = (s: DiagramState) => ({
  initialized: s.xyflowInitialized,
  fitViewPadding: s.fitViewPadding,
  viewLayout: s.view.id + '_' + s.view.autoLayout + '_' + s.fitViewPadding,
  viewWidth: s.view.width,
  viewHeight: s.view.height,
  viewportMoved: s.viewportMoved
})
/**
 * Fits the view when the view changes and nodes are initialized
 */
function FitViewOnDiagramChanges() {
  // const

  const state = useDiagramStore(select)

  const xyflow = useXYFlow()

  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const isReady = nodeInitialized && state.viewLayout

  const prevViewLayoutRef = useRef(state.viewLayout)

  console.debug(`FitViewOnDiagramChange:
  initialized: ${state.initialized}
  nodeInitialized: ${nodeInitialized}
  isReady: ${isReady}
  viewportMoved: ${state.viewportMoved}
  `)
  // const xyflow = xyflowStoreApi.getState()

  useDebouncedEffect(
    () => {
      if (!isReady) {
        console.debug(`FitViewOnDiagramChange not ready`)
        return
      }
      if (!isReady || prevViewLayoutRef.current === state.viewLayout) {
        console.debug(`FitViewOnDiagramChange skipped`)
        return
      }
      console.debug(`FitViewOnDiagramChange fitView`)
      // const xyflow = xyflowStoreApi.getState()
      const zoom = xyflow.getZoom()
      xyflow.setCenter(state.viewWidth / 2, state.viewHeight / 2, {
        duration: 150,
        zoom
      })
      xyflow.fitBounds({
        x: 0,
        y: 0,
        width: state.viewWidth,
        height: state.viewHeight
      }, {
        duration: 350,
        padding: state.fitViewPadding
      })
      // diagramApi.
      // updateState({ viewportMoved: false })
      prevViewLayoutRef.current = state.viewLayout
    },
    [isReady, state.viewLayout],
    100
  )

  if (!state.viewportMoved) {
    return <FitViewOnViewportResize />
  }

  return null

  // TODO: listen to resize event
  // return <div className={clsx('react-flow__panel')}></div>
}

export const FitViewOnDiagramChange = memo(FitViewOnDiagramChanges) as unknown as typeof FitViewOnDiagramChanges
