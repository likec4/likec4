import { useComputedColorScheme, useMantineContext } from '@mantine/core'
import { deepEqual as eq } from 'fast-equals'
import { memo, useEffect } from 'react'
import { getUntrackedObject } from 'react-tracked'
import { find, omit } from 'remeda'
import useTilg from 'tilg'
import { useUpdateEffect } from '../hooks/use-update-effect'
import type { LikeC4DiagramProps } from '../props'
import { useXYFlow } from '../xyflow'
import type { XYFlowNode } from '../xyflow/types'
import { fromDiagramView } from './fromDiagramView'
import { useDiagramStateTracked, useUpdateDiagramState } from './state'

function isNodesEqual(a: XYFlowNode, b: XYFlowNode) {
  return a.id === b.id
    && eq(a.type, b.type)
    && eq(a.data, b.data)
    && eq(a.position, b.position)
    && eq(a.width, b.width)
    && eq(a.height, b.height)
}

function findById<T extends { id: string }>(arr: T[], id: string) {
  return find(arr, e => e.id === id)
}

/**
 * Syncs the diagram state with the XYFlow instance
 */
export const DiagramStateSync = memo(function DiagramStateSyncInner() {
  useTilg()
  const state = useDiagramStateTracked(),
    initialized = state.viewportInitialized,
    nodes = state.viewNodes,
    edges = state.viewEdges

  const xyflow = useXYFlow()

  useUpdateEffect(() => {
    if (!initialized) {
      return
    }
    const updates = fromDiagramView({
      nodes: getUntrackedObject(nodes)!,
      edges: getUntrackedObject(edges)!
    }, state.nodesDraggable)

    xyflow.setNodes(prev =>
      updates.nodes.map(<N extends XYFlowNode>(update: N): N => {
        const existing = findById(prev, update.id)
        if (existing) {
          if (isNodesEqual(existing, update) && existing.parentNode == update.parentNode) {
            return existing as N
          }
          return {
            ...omit(existing, ['parentNode']),
            ...update
          }
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
        } else {
          return edge
        }
      })
    )
  }, [initialized ?? false, nodes, edges])

  return null
})

// export const ColorSchemeSync = ({ colorMode }: Pick<LikeC4DiagramProps, 'colorMode'>) => {
//   const update = useUpdateDiagramState()
//   const _computed = useComputedColorScheme('light')
//   const { colorScheme } = useMantineContext()

//   const computed = colorScheme !== 'auto' ? colorScheme : _computed
//   const scheme = colorMode && colorMode !== 's' ? colorMode : computed

//   useEffect(() => {
//     update({ colorMode: scheme })
//   }, [scheme])

//   return null
// }
