import { getBezierPath } from '@xyflow/system'
import { customEdge, EdgeActionButton, EdgeContainer, EdgeLabel, EdgePath } from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes } from '../_types'

export const edgeTypes = {
  relationships: customEdge<RelationshipsBrowserTypes.EdgeData>((props) => {
    const { enableNavigateTo } = useEnabledFeature('NavigateTo')
    const {
      data: {
        navigateTo,
        relations,
      },
    } = props
    const [svgPath, labelX, labelY] = getBezierPath(props)
    const diagram = useDiagram()

    const edgeProps = relations.length > 1
      ? {
        ...props,
        data: {
          ...props.data,
          line: 'solid',
          color: 'amber',
        } satisfies RelationshipsBrowserTypes.EdgeData,
      }
      : props

    return (
      <EdgeContainer {...edgeProps}>
        <EdgePath
          {...edgeProps}
          svgPath={svgPath}
          {...relations.length > 1 && {
            strokeWidth: 5,
          }}
        />
        <EdgeLabel
          edgeProps={edgeProps}
          labelPosition={{
            x: labelX,
            y: labelY,
            translate: 'translate(-50%, 0)',
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
