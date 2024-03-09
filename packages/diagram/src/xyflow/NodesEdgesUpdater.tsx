import { useComputedColorScheme, useMantineContext } from '@mantine/core'
import { deepEqual as eq } from 'fast-equals'
import { memo, useEffect, useRef } from 'react'
import { getUntrackedObject } from 'react-tracked'
import { find, omit, prop } from 'remeda'
import useTilg from 'tilg'
import { useUpdateEffect } from '../hooks/use-update-effect'
import type { LikeC4DiagramProps } from '../props'
import { useXYFlow } from '.'
import type { XYFlowNode } from './types'

import type { DiagramView } from '@likec4/core'
import { useNodesInitialized, useStore, useStoreApi } from '@xyflow/react'
import { fromDiagramView } from '../state/fromDiagramView'
import { useDiagramState } from '../state2'

function isNodesEqual(a: XYFlowNode, b: XYFlowNode) {
  return a.id === b.id
    && eq(a.type, b.type)
    && eq(a.data, b.data)
  // && eq(a.position, b.position)
  // && eq(a.width, b.width)
  // && eq(a.height, b.height)
}

/**
 * Syncs the diagram state with the XYFlow instance
 */
export function NodesEdgesUpdater({
  nodesDraggable,
  view: {
    nodes,
    edges
  }
}: { view: DiagramView; nodesDraggable: boolean }) {
  const xyflow = useXYFlow()
  const initialized = xyflow.viewportInitialized

  useUpdateEffect(() => {
    const updates = fromDiagramView({
      nodes,
      edges
    }, nodesDraggable)

    xyflow.setNodes(prev =>
      updates.nodes.map(<N extends XYFlowNode>(update: N): N => {
        const existing = prev.find(p => p.id === update.id)
        if (existing && existing.parentNode == update.parentNode) {
          const { position, data, parentNode, ...rest } = update
          existing.position.x = position.x
          existing.position.y = position.y
          if (!eq(existing.data, data)) {
            existing.data = data
          }
          return Object.assign(existing, rest as N)
        }
        return update
      })
    )

    xyflow.setEdges(prev =>
      updates.edges.map(edge => {
        const existing = prev.find(e => e.id === edge.id)
        if (existing) {
          if (eq(existing.data.edge, edge.data.edge)) {
            return existing
          }
          return {
            ...existing,
            ...edge
          }
        }
        return edge
      })
    )
  }, [initialized, nodes, edges])

  return null
}
