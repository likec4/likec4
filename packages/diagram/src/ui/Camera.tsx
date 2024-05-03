import { shallowEqual } from '@mantine/hooks'
import { useDebouncedEffect, useIsMounted } from '@react-hookz/web'
import {
  type ReactFlowState,
  useOnSelectionChange,
  useOnViewportChange,
  useStore,
  useUpdateNodeInternals,
  type Viewport
} from '@xyflow/react'
import { memo, useEffect, useRef, useState } from 'react'
import { uniq } from 'remeda'
import { useXYFlow } from '../xyflow/hooks'
import type { XYFlowNode } from '../xyflow/types'
import { distance } from '../xyflow/utils'

const selector = (state: ReactFlowState) => {
  return {
    isUserSelectionActive: state.userSelectionActive,
    isDragging: state.paneDragging || state.nodes.some(n => n.dragging ?? false)
  }
}

const CameraMemo = /* @__PURE__ */ memo(function Camera() {
  const isMounted = useIsMounted()
  // const isUserSelectionActive = useStore(selectUserSelectionActive)
  const {
    isUserSelectionActive,
    isDragging
  } = useStore(selector, shallowEqual)
  const reactflow = useXYFlow()
  const updateNd = useUpdateNodeInternals()

  const padding = 0 // editor.fitViewPadding
  const viewId = '' // editor.viewId
  const fitOnSelect: boolean = false // editor.fitOnSelect

  const previousViewport = useRef<Viewport | null>(null)
  const isZoomPendingRef = useRef(false)

  const viewportChangeStart = useRef<Viewport | null>(null)
  const prevViewId = useRef(viewId)
  const isReady = reactflow.viewportInitialized
  const selectedNodesRef = useRef([] as string[])

  const [selectedNodes, setSelectedNodes] = useState([] as XYFlowNode[])

  // WORKAROUND

  useOnViewportChange({
    onStart: (viewport) => {
      viewportChangeStart.current = { ...viewport }
    },
    onEnd: (end) => {
      if (!previousViewport.current) {
        viewportChangeStart.current = null
      }
      if (!viewportChangeStart.current) {
        return
      }
      const start = {
        ...viewportChangeStart.current
      }
      const d = distance(start, end)
      if (d > 15) {
        previousViewport.current = null
      }
      viewportChangeStart.current = null
    }
  })

  const fixUseOnViewportChange = () => {
    // WORKAROUND:
    // react-flow triggers useOnViewportChange
    // We reset the viewportChangeStart, before useOnViewportChange.onEnd called
    setTimeout(() => {
      viewportChangeStart.current = null
    }, 50)
  }

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if (!isMounted() || fitOnSelect === false) {
        return
      }
      if (nodes.length === 0 && edges.length === 0) {
        setSelectedNodes([])
        return
      }
      const selected = new Set([
        ...nodes.map(({ id }) => reactflow.getNode(id)),
        ...edges.flatMap((edge) => [
          reactflow.getNode(edge.source),
          reactflow.getNode(edge.target)
        ])
      ].filter(Boolean))
      setSelectedNodes([...selected])
    }
  })

  const selectedNodesHash = selectedNodes.map((node) => node.id).sort().join('\n')
  useEffect(() => {
    isZoomPendingRef.current = selectedNodesHash !== ''
  }, [selectedNodesHash])

  useDebouncedEffect(
    () => {
      if (isUserSelectionActive || isDragging || !isReady) {
        return
      }
      if (selectedNodes.length === 0) {
        if (previousViewport.current) {
          console.log(`Camera: revert viewport`)
          reactflow.setViewport(previousViewport.current, {
            duration: 300
          })
          previousViewport.current = null
        }
        return
      }
      if (!isZoomPendingRef.current) {
        return
      }
      isZoomPendingRef.current = false
      previousViewport.current ??= { ...reactflow.getViewport() }
      const zoom = previousViewport.current.zoom
      reactflow.fitView({
        duration: 350,
        maxZoom: Math.max(1, zoom),
        padding,
        nodes: selectedNodes
      })
      fixUseOnViewportChange()
    },
    [selectedNodesHash, isReady, isDragging, isUserSelectionActive],
    previousViewport.current ? 100 : 1500
    // previousViewport.current ? 200 : 2500
  )

  useEffect(() => {
    const ids = selectedNodes.map((node) => node.id)
    for (const id of uniq([...selectedNodesRef.current, ...ids])) {
      try {
        updateNd(id)
      } catch (e) {
        console.warn(`Camera: failed useUpdateNodeInternals`, e)
      }
    }
    selectedNodesRef.current = ids
  }, [selectedNodesHash, updateNd])

  useDebouncedEffect(
    () => {
      if (!isReady || prevViewId.current === viewId) {
        return
      }
      const zoom = previousViewport.current?.zoom ?? reactflow.getZoom()
      reactflow.fitView({
        duration: 400,
        maxZoom: Math.max(1, zoom),
        padding
      })
      previousViewport.current = null
      prevViewId.current = viewId
    },
    [isReady, viewId],
    50,
    500
  )

  return null
})

export default CameraMemo
