import { useDebouncedEffect, useDebouncedState } from '@react-hookz/web'
import { useNodesInitialized } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { memo, useEffect, useRef, useState } from 'react'
import { type DiagramState, useDiagramStore, useDiagramStoreApi } from '../store'
import { MinZoom } from './const'
import { useXYFlow, useXYStore } from './hooks'
import type { XYFlowState } from './types'

function selector(state: XYFlowState) {
  return {
    dimensions: `${Math.round(state.width)}:${Math.round(state.height)}`,
    fitView: state.fitView
  }
}

function FitViewOnViewportResize() {
  const fitViewPadding = useDiagramStore(s => s.fitViewPadding)
  const {
    dimensions,
    fitView
  } = useXYStore(selector)
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      if (prevDimensionsRef.current === dimensions) {
        return
      }
      fitView({
        includeHiddenNodes: true,
        duration: 350,
        padding: fitViewPadding,
        minZoom: MinZoom,
        maxZoom: 1
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

const detectDiagramChange = (s: DiagramState) => s.view.id + '_' + s.view.autoLayout + '_' + s.fitViewPadding

/**
 * Fits the view when the view changes and nodes are initialized
 */
function FitViewOnDiagramChanges() {
  const diagramApi = useDiagramStoreApi()
  const xyflow = useXYFlow()

  const [viewportMoved, setViewportMoved] = useState(false)
  const [processedChangeId, setProcessed] = useState(() => detectDiagramChange(diagramApi.getState()))
  const [pendingChangeId, setPending] = useDebouncedState(processedChangeId, 100)

  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const isReady = nodeInitialized && xyflow.viewportInitialized

  useEffect(() => {
    return diagramApi.subscribe(
      s => ({
        viewportMoved: s.viewportMoved,
        changeid: detectDiagramChange(s)
      }),
      ({ viewportMoved, changeid }) => {
        setPending(changeid)
        setViewportMoved(viewportMoved)
      },
      {
        equalityFn: shallowEqual
      }
    )
  }, [diagramApi])

  // const

  // const state = useDiagramStore(select)

  // const xyflow = useXYFlow()

  // const nodeInitialized = useNodesInitialized({
  //   includeHiddenNodes: true
  // })
  // const isReady = nodeInitialized && xyflow.viewportInitialized

  // const prevViewLayoutRef = useRef(state.viewLayout)

  useEffect(
    () => {
      if (!isReady) {
        console.debug(`FitViewOnDiagramChange not ready`)
        return
      }
      if (processedChangeId === pendingChangeId) {
        console.debug(`FitViewOnDiagramChange already processed`)
        return
      }
      const { view, fitViewPadding } = diagramApi.getState()
      console.debug(`FitViewOnDiagramChange fitView  ${processedChangeId} -> ${pendingChangeId}`)
      // const xyflow = xyflowStoreApi.getState()
      const zoom = Math.min(xyflow.getZoom(), 0.9)
      xyflow.setCenter(view.width / 2, view.height / 2, {
        duration: 120,
        zoom
      })
      xyflow.fitView({
        includeHiddenNodes: true,
        duration: 350,
        padding: fitViewPadding,
        minZoom: MinZoom,
        maxZoom: 1
      })
      // xyflow.fitBounds({
      //   x: 0,
      //   y: 0,
      //   width: view.width,
      //   height: view.height
      // }, {
      //   duration: 350,
      //   padding: fitViewPadding
      // })
      setProcessed(pendingChangeId)
      // diagramApi.
      // updateState({ viewportMoved: false })
      // prevViewLayoutRef.current = state.viewLayout
    },
    [isReady, processedChangeId, pendingChangeId]
  )

  if (!viewportMoved && isReady) {
    return <FitViewOnViewportResize />
  }

  return null

  // TODO: listen to resize event
  // return <div className={clsx('react-flow__panel')}></div>
}

export const FitViewOnDiagramChange = memo(FitViewOnDiagramChanges) as unknown as typeof FitViewOnDiagramChanges
