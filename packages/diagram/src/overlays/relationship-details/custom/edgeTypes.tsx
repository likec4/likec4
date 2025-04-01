import { getBezierPath } from '@xyflow/system'
import {
  customEdge,
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
} from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes } from '../_types'

export const RelationshipEdge = customEdge<RelationshipDetailsTypes.EdgeData>((props) => {
  const { enableNavigateTo } = useEnabledFeature('NavigateTo')
  const {
    sourceX,
    targetY,
    data: { navigateTo },
  } = props
  const [svgPath, labelX, labelY] = getBezierPath(props)
  const diagram = useDiagram()
  return (
    <EdgeContainer {...props}>
      <EdgePath {...props} svgPath={svgPath} />
      <EdgeLabelContainer
        edgeProps={props}
        labelPosition={{
          x: labelX,
          y: labelY,
          translate: 'translate(-50%, 0)',
        }}
        style={{
          maxWidth: Math.abs(props.targetX - props.sourceX - 100),
        }}>
        <EdgeLabel edgeProps={props}>
          {enableNavigateTo && navigateTo && (
            <EdgeActionButton
              {...props}
              onClick={e => {
                e.stopPropagation()
                diagram.navigateTo(navigateTo)
              }} />
          )}
        </EdgeLabel>
      </EdgeLabelContainer>
    </EdgeContainer>
  )
})
