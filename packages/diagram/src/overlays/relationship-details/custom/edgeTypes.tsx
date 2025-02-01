import { getBezierPath } from '@xyflow/system'
import { customEdge, EdgeActionButton, EdgeContainer, EdgeLabel, EdgePath } from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes } from '../_types'

export const edgeTypes = {
  relationship: customEdge<RelationshipDetailsTypes.EdgeData>((props) => {
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
        <EdgeLabel
          edgeProps={props}
          labelPosition={{
            x: labelX,
            y: labelY,
            translate: 'translate(-50%, 0)',
          }}
          style={{
            maxWidth: Math.abs(props.targetX - props.sourceX - 70),
          }}>
          {enableNavigateTo && navigateTo && (
            <EdgeActionButton
              {...props}
              onClick={e => {
                e.stopPropagation()
                diagram.navigateTo(navigateTo)
              }} />
          )}
        </EdgeLabel>
      </EdgeContainer>
    )
  }),
} satisfies {
  [key in RelationshipDetailsTypes.Edge['type']]: any
}
