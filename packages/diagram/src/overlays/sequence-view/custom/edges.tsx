import { getSmoothStepPath } from '@xyflow/system'
import type { EdgeProps } from '../../../base'
import { EdgeContainer, EdgePath } from '../../../base/primitives'
import type { SequenceViewTypes } from '../_types'

export function StepEdge(props: EdgeProps<SequenceViewTypes.StepEdge>) {
  const [path, labelX, labelY, offsetX, offsetY] = getSmoothStepPath(props)
  return (
    <EdgeContainer {...props}>
      <EdgePath
        edgeProps={props}
        svgPath={path}
      />
    </EdgeContainer>
  )
}
