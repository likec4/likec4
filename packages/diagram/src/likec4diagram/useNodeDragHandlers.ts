import type { EdgeRouting } from '@likec4/core'
import type {
  OnNodeDrag,
} from '@xyflow/react'
import type { DiagramApi } from '../hooks/useDiagram'
import type { Types } from './types'
import { useLayoutConstraints } from './useLayoutConstraints'
import { type GraphTopologyData, useGraphForceSimulation } from './xyflow-graph/useGraphForceSimulation'

type NodeDragHandlers = {
  onNodeDragStart: OnNodeDrag<Types.Node>
  onNodeDrag: OnNodeDrag<Types.Node>
  onNodeDragStop: OnNodeDrag<Types.Node>
}
/**
 * Keeps the layout constraints (parent nodes and children) when dragging a node
 */
export function useNodeDragHandlers({
  nodesDraggable,
  viewRouting,
  isGraphVariant,
  graphTopology,
  diagram,
}: {
  nodesDraggable: boolean
  viewRouting: EdgeRouting
  isGraphVariant: boolean
  graphTopology: GraphTopologyData | null
  diagram: DiagramApi
}): NodeDragHandlers | undefined {
  const graphForceHandlers = useGraphForceSimulation({
    enabled: isGraphVariant,
    topology: graphTopology ?? {
      graphNodes: [],
      graphEdges: [],
      topologyKey: '-none-',
    },
    diagram,
  })

  const layoutConstraints = useLayoutConstraints({
    routing: viewRouting,
    diagram,
  })

  if (!nodesDraggable) {
    return undefined
  }

  if (isGraphVariant && graphTopology && graphTopology.graphNodes.length > 0) {
    return graphForceHandlers
  }

  return layoutConstraints
}
