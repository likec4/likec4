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
import type { RelationshipsBrowserTypes } from '../_types'

export const RelationshipEdge = customEdge<RelationshipsBrowserTypes.EdgeData>((props) => {
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
      <EdgeLabelContainer
        edgeProps={edgeProps}
        labelPosition={{
          x: labelX,
          y: labelY,
          translate: 'translate(-50%, 0)',
        }}
        style={{
          maxWidth: Math.min(Math.abs(props.targetX - props.sourceX - 70), 250),
        }}
      >
        <EdgeLabel edgeProps={edgeProps}>
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
