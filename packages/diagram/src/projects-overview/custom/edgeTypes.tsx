import { useStore } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { hasAtLeast } from 'remeda'
import {
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  memoEdge,
} from '../../base-primitives'
import { edgeEndFromNode } from '../../utils/edge-endpoints'
import { layoutedEdgePath } from '../../utils/edge-path'
import { bezierPath } from '../../utils/xyflow'
import type { ProjectsOverviewTypes } from '../_types'

export const RelationshipEdge = memoEdge<ProjectsOverviewTypes.EdgeProps>((edgeProps) => {
  const routing = edgeProps.data.routing
  const endpoints = useStore(state => ({
    source: edgeEndFromNode(state.nodeLookup.get(edgeProps.source), 'source'),
    target: edgeEndFromNode(state.nodeLookup.get(edgeProps.target), 'target'),
  }), deepEqual)
  const path = routing === 'ortho'
      && endpoints.source
      && endpoints.target
      && hasAtLeast(edgeProps.data.points, 1)
    ? layoutedEdgePath({
      points: edgeProps.data.points,
      routing,
      source: endpoints.source,
      target: endpoints.target,
    }).d
    : bezierPath(edgeProps.data.points)

  return (
    <EdgeContainer {...edgeProps}>
      <EdgePath
        edgeProps={edgeProps}
        svgPath={path}
      />
      <EdgeLabelContainer edgeProps={edgeProps}>
        <EdgeLabel edgeProps={edgeProps} />
      </EdgeLabelContainer>
    </EdgeContainer>
  )
})
