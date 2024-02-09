import { nonNullable } from '@likec4/core'
import { useShallowEffect } from '@mantine/hooks'
import {
  useDebouncedCallback,
  useDebouncedEffect,
  useIsMounted,
  useList,
  useMap,
  useUpdateEffect
} from '@react-hookz/web'
import {
  type Node as ReactFlowNode,
  type ReactFlowState,
  useOnSelectionChange,
  useOnViewportChange,
  useReactFlow,
  useStore,
  useStoreApi,
  useUpdateNodeInternals,
  type Viewport
} from '@xyflow/react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { difference, hasAtLeast, uniq } from 'remeda'
import useTilg from 'tilg'
import { distance } from '../utils'

const selectUserSelectionActive = (state: ReactFlowState) => state.userSelectionActive

const CameraMemo = memo(function Camera({ viewId }: { viewId: string }) {
  const isMounted = useIsMounted()
  const isUserSelectionActive = useStore(selectUserSelectionActive)
  const reactflow = useReactFlow()
  const updateNd = useUpdateNodeInternals()

  const previousViewport = useRef<Viewport | null>(null)
  const viewportChangeStart = useRef<Viewport | null>(null)
  const prevViewId = useRef<string | null>(null)
  const isReady = reactflow.viewportInitialized
  const selectedNodesRef = useRef([] as string[])

  const [selectedNodes, setSelectedNodes] = useState([] as ReactFlowNode[])

  // WORKAROUND

  useOnViewportChange({
    onStart: (viewport) => {
      viewportChangeStart.current = { ...viewport }
    },
    onEnd: (end) => {
      if (!viewportChangeStart.current || !previousViewport.current) {
        viewportChangeStart.current = null
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
    }, 30)
  }

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if (!isMounted() || !reactflow.viewportInitialized) {
        return
      }
      // storeApi.getState().
      // if (storeApi.getState().userSelectionActive) {
      //   return
      // }
      if (nodes.length === 0 && edges.length === 0) {
        setSelectedNodes([])
        return
      }
      //   if (previousViewport.current) {
      //     console.log(`Camera: revert viewport`)
      //     reactflow.setViewport(previousViewport.current, {
      //       duration: 300
      //     })
      //     previousViewport.current = null
      //   }
      //   updateSelectedNodes([])
      //   return
      // }

      const selected = new Set<ReactFlowNode>([
        ...nodes,
        ...edges.flatMap((edge) => [
          reactflow.getNode(edge.source),
          reactflow.getNode(edge.target)
        ]).filter(Boolean)
      ])
      setSelectedNodes([...selected])
      // updateSelectedNodes(nodes)

      // previousViewport.current ??= { ...reactflow.getViewport() }
      // const zoom = reactflow.getZoom()
      // reactflow.fitView({
      //   duration: 350,
      //   maxZoom: Math.max(1.07, zoom),
      //   padding: 0.1,
      //   nodes
      // })
      // fixUseOnViewportChange()
    }
  })

  const selectedNodesHash = selectedNodes.map((node) => node.id).sort().join(',')
  useEffect(
    () => {
      if (isUserSelectionActive) {
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
      previousViewport.current ??= { ...reactflow.getViewport() }
      const zoom = reactflow.getZoom()
      reactflow.fitView({
        duration: 350,
        maxZoom: Math.max(1.07, zoom),
        padding: 0.1,
        nodes: selectedNodes
      })
      fixUseOnViewportChange()
    },
    [selectedNodesHash, isUserSelectionActive]
    // 100
  )

  useShallowEffect(() => {
    const ids = selectedNodes.map((node) => node.id)
    const toUpdate = difference
    for (const id of uniq([...selectedNodesRef.current, ...ids])) {
      try {
        updateNd(id)
      } catch (e) {
        console.warn(`Camera: failed useUpdateNodeInternals`, e)
      }
    }
    selectedNodesRef.current = ids
  }, [selectedNodesHash])

  const scheduleFitViewAnimation = useDebouncedCallback(
    () => {
      if (isMounted()) {
        previousViewport.current = null
        const zoom = reactflow.getZoom()
        reactflow.fitView({
          duration: 350,
          maxZoom: Math.max(1.05, zoom),
          padding: 0.1
        })
      }
    },
    [reactflow],
    100
  )

  useEffect(() => {
    if (!isReady || prevViewId.current === viewId) {
      return
    }
    if (prevViewId.current) {
      scheduleFitViewAnimation()
    } else {
      reactflow.fitView()
    }
    prevViewId.current = viewId
  }, [isReady, viewId])

  return null
})

export default CameraMemo
