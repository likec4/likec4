import {
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  memoEdge,
} from '../../base-primitives'
import { bezierPath } from '../../utils/xyflow'
import type { ProjectsOverviewTypes } from '../_types'

export const RelationshipEdge = memoEdge<ProjectsOverviewTypes.EdgeProps>((edgeProps) => {
  const path = bezierPath(edgeProps.data.points)

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
