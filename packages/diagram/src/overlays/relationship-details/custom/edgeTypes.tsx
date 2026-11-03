import {
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  memoEdge,
} from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import { edgePathThroughLabel } from '../../../utils/edge-path-through-label'
import type { RelationshipDetailsTypes } from '../_types'

export const RelationshipEdge = memoEdge<RelationshipDetailsTypes.EdgeProps>((props) => {
  const { enableNavigateTo } = useEnabledFeatures()
  const {
    data: { navigateTo, labelBBox },
  } = props
  // the label is placed by the layout, the edge goes through it
  const [svgPath, labelPosition] = edgePathThroughLabel(props, labelBBox)
  const diagram = useDiagram()
  return (
    <EdgeContainer {...props}>
      <EdgePath edgeProps={props} svgPath={svgPath} />
      <EdgeLabelContainer
        edgeProps={props}
        labelPosition={labelPosition}
        {...!labelBBox && {
          style: {
            maxWidth: Math.abs(props.targetX - props.sourceX - 100),
          },
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
