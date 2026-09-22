import type { EdgeRouting } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { useCallback } from 'react'
import { isTruthy } from 'remeda'
import { useTrackRoutes } from '../../../hooks/useEdgeTracks'
import { useXYStore } from '../../../hooks/useXYFlow'
import { edgeEndFromNode } from '../../../utils/edge-endpoints'
import { type DrawnEdge, layoutedEdgePath } from '../../../utils/edge-path'
import { trackedEdgePath } from '../../../utils/edge-tracks'
import type { Types } from '../../types'

/**
 * @returns The SVG path data and, for orthogonal routing, straight segments for label placement.
 */
export function useRelationshipEdgePath({
  props: {
    id,
    source,
    target,
    data,
  },
  controlPoints,
  isControlPointDragging,
  routing,
}: {
  props: Types.EdgeProps<'relationship'>
  controlPoints: XYPosition[]
  isControlPointDragging: boolean
  routing: EdgeRouting
}): DrawnEdge {
  const endpoints = useXYStore(
    useCallback(({ nodeLookup }) => ({
      source: nonNullable(edgeEndFromNode(nodeLookup.get(source), 'source'), `source node ${source} not found`),
      target: nonNullable(edgeEndFromNode(nodeLookup.get(target), 'target'), `target node ${target} not found`),
    }), [source, target]),
    deepEqual,
  )

  const isModified = isTruthy(data.controlPoints) || isControlPointDragging
  const trackRoutes = useTrackRoutes(routing, isModified)

  const edge = {
    ...endpoints,
    dir: data.dir,
    routing,
  }
  if (!isModified) {
    return layoutedEdgePath({ ...edge, points: data.points })
  }
  return trackedEdgePath({ ...edge, id, controlPoints, others: trackRoutes.values() })
}
