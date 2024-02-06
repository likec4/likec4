import { nonNullable } from '@likec4/core'
import { useDebouncedCallback, useIsMounted, useUpdateEffect } from '@react-hookz/web'
import { useOnSelectionChange, useOnViewportChange, useReactFlow, useStoreApi, type Viewport } from '@xyflow/react'
import { memo, useEffect, useRef } from 'react'
import { hasAtLeast } from 'remeda'
import useTilg from 'tilg'
import { distance } from '../utils'

const Ignore = Symbol.for('Ignore') as unknown as Viewport

const CameraMemo = memo(function Camera({ viewId }: { viewId: string }) {
  useTilg()
  const isMounted = useIsMounted()
  const reactflowApi = useReactFlow()
  const previousViewport = useRef<Viewport | null>(null)
  const viewportChangeStart = useRef<Viewport | null>(null)
  // const [selectedNodes, setSelectedNodes] = useState([] as EditorNode[])

  useOnViewportChange({
    onStart: (viewport) => {
      if (viewportChangeStart.current === Ignore) {
        viewportChangeStart.current === null
        return
      }
      viewportChangeStart.current = { ...viewport }
    },
    onEnd: (end) => {
      if (!viewportChangeStart.current) {
        return
      }
      if (viewportChangeStart.current === Ignore) {
        viewportChangeStart.current === null
        return
      }
      if (previousViewport.current) {
        const start = {
          ...viewportChangeStart.current
        }
        const d = distance(start, end)
        console.log(`Camera: useOnViewportChange distance=${d}`)
        if (d > 10) {
          previousViewport.current = null
        }
      }
      viewportChangeStart.current = null
    }
  })

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if (!isMounted()) {
        return
      }
      if (nodes.length === 0 && edges.length === 0) {
        if (previousViewport.current) {
          console.log(`Camera: revert viewport`)
          reactflowApi.setViewport(previousViewport.current, {
            duration: 200
          })
          previousViewport.current = null
        }
        return
      }
      if (nodes.length === 0 && hasAtLeast(edges, 1)) {
        previousViewport.current ??= reactflowApi.getViewport()
        const edge = edges[0]
        // WORKAROUND: react-flow triggers useOnViewportChange
        viewportChangeStart.current = Ignore
        reactflowApi.fitView({
          duration: 350,
          maxZoom: 1.05,
          padding: 0.1,
          nodes: [
            reactflowApi.getNode(edge.source),
            reactflowApi.getNode(edge.target)
          ].filter(Boolean)
        })
        // // WORKAROUND: react-flow triggers useOnViewportChange
        // setTimeout(() => {
        //   viewportChangeStart.current = null
        // }, 50)
        return
      }
      if (nodes.length > 0 && edges.length === 0) {
        previousViewport.current ??= reactflowApi.getViewport()
        const zoom = reactflowApi.getZoom()
        viewportChangeStart.current = Ignore
        reactflowApi.fitView({
          duration: 350,
          maxZoom: Math.max(1.07, zoom),
          padding: 0.1,
          nodes
        })
        // WORKAROUND: react-flow triggers useOnViewportChange
        // setTimeout(() => {
        //   viewportChangeStart.current = null
        // }, 50)
        return
      }
    }
  })

  const scheduleFitViewAnimation = useDebouncedCallback(
    () => {
      if (isMounted()) {
        console.log(`scheduleFitViewAnimation`)
        previousViewport.current = null
        viewportChangeStart.current = Ignore
        const zoom = reactflowApi.getZoom()
        reactflowApi.fitView({
          duration: 350,
          maxZoom: Math.max(1.05, zoom),
          padding: 0.1
        })
      }
    },
    [reactflowApi],
    100
  )

  useUpdateEffect(() => {
    previousViewport.current = null
    viewportChangeStart.current = Ignore
    const zoom = reactflowApi.getZoom()
    reactflowApi.fitView({
      maxZoom: zoom,
      minZoom: zoom
    })
    scheduleFitViewAnimation()
  }, [viewId])

  return null
}, (prev, next) => prev.viewId === next.viewId)

export default CameraMemo
