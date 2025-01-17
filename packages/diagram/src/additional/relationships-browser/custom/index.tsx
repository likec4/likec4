import { getBezierPath } from '@xyflow/system'
import {
  CompoundNodeContainer,
  CompoundTitle,
  customEdge,
  customNode,
  DefaultHandles,
  EdgeContainer,
  EdgePath,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../../../base/primitives'
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
    const [svgPath, labelX, labelY] = getBezierPath(props)
    return (
      <EdgeContainer {...props}>
        <EdgePath {...props} svgPath={svgPath} />
        {
          /* <EdgeLabel {...props}>
          {enableNavigateTo && navigateTo && (
            <EdgeActionButton
              {...props}
              onClick={e => {
                e.stopPropagation()
                diagram.navigateTo(navigateTo)
              }} />
          )}
        </EdgeLabel> */
        }
      </EdgeContainer>
    )
  }),
} satisfies { [key in RelationshipsBrowserTypes.Edge['type']]: any }
