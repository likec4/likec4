import { getBezierPath } from '@xyflow/system'
import { customEdge, EdgeActionButton, EdgeContainer, EdgeLabel, EdgePath } from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes } from '../_types'

export const edgeTypes = {
  relationships: customEdge<RelationshipsBrowserTypes.EdgeData>((props) => {
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
          labelXY={{
            x: `calc(${labelX}px - 50%)`,
            y: `calc(${labelY}px - 100%)`,
          }}
          style={{
            maxWidth: Math.min(Math.abs(props.targetX - props.sourceX - 70), 250),
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
        {
          /* <EdgeLabel {...props}>

        </EdgeLabel> */
        }
      </EdgeContainer>
    )
  }),
} satisfies {
  [key in RelationshipsBrowserTypes.Edge['type']]: any
}
