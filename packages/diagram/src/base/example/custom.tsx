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
} from '../primitives'
import type { ExampleTypes } from './_types'

export const nodeTypes = {
  element: customNode<ExampleTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <DefaultHandles />
      </ElementNodeContainer>
    )
  }),

  compound: customNode<ExampleTypes.CompoundNodeData>((props) => {
    return (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )
  }),
} satisfies { [key in ExampleTypes.Node['type']]: any }

export const edgeTypes = {
  relationships: customEdge<ExampleTypes.EdgeData>((props) => {
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
} satisfies { [key in ExampleTypes.Edge['type']]: any }
