import { getBezierPath } from '@xyflow/system'
import {
  CompoundNodeContainer,
  CompoundTitle,
  customEdge,
  customNode,
  DefaultHandles,
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgePath,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks2'
import type { RelationshipsBrowserTypes } from '../_types'
import { ElementActions } from './ElementActions'

export const nodeTypes = {
  element: customNode<RelationshipsBrowserTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <ElementActions {...props} />
        <DefaultHandles />
      </ElementNodeContainer>
    )
  }),

  compound: customNode<RelationshipsBrowserTypes.CompoundNodeData>((props) => {
    return (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )
  }),
} satisfies { [key in RelationshipsBrowserTypes.Node['type']]: any }

export const edgeTypes = {
  relationships: customEdge<RelationshipsBrowserTypes.EdgeData>((props) => {
    const { enableNavigateTo } = useEnabledFeature('NavigateTo')
    const { navigateTo } = props.data
    const [svgPath, labelX, labelY] = getBezierPath(props)
    const diagram = useDiagram()
    return (
      <EdgeContainer {...props}>
        <EdgePath {...props} svgPath={svgPath} />
        <EdgeLabel {...props} labelXY={{ x: labelX, y: labelY }}>
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
} satisfies { [key in RelationshipsBrowserTypes.Edge['type']]: any }
