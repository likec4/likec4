import { Handle } from '@xyflow/react'
import { getBezierPath, Position } from '@xyflow/system'
import { m } from 'framer-motion'
import type { NodeProps } from '../../../base'
import {
  CompoundNodeContainer,
  CompoundTitle,
  customEdge,
  customNode,
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
import type { RelationshipDetailsTypes } from '../_types'
import { ElementActions } from './ElementActions'

export const nodeTypes = {
  element: customNode<RelationshipDetailsTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer nodeProps={props}>
        <ElementShape {...props} />
        <ElementTitle {...props} iconSize={40} />
        <ElementActions {...props} />
        <ElementPorts {...props} />
      </ElementNodeContainer>
    )
  }),

  compound: customNode<RelationshipDetailsTypes.CompoundNodeData>((props) => {
    return (
      <CompoundNodeContainer nodeProps={props}>
        <CompoundTitle {...props} />
        <CompoundPorts {...props} />
      </CompoundNodeContainer>
    )
  }),
} satisfies { [key in RelationshipDetailsTypes.Node['type']]: any }

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
          component={m.div}
          drag
          dragElastic={0}
          dragMomentum={false}
          // @ts-expect-error TODO: fix this
          edgeProps={props}
          labelXY={{
            x: labelX,
            y: labelY,
          }}
          style={{
            // transform: `translate(${labelX}px, ${labelY}px)  translate(-50%, 0)`,
            maxWidth: Math.abs(props.targetX - props.sourceX - 70),
            // translate(${fallbackVar(varLabelX, '-50%')}, ${fallbackVar(varLabelY, '-50%')})
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
} satisfies { [key in RelationshipDetailsTypes.Edge['type']]: any }

type ElementPortsProps = NodeProps<
  Pick<
    RelationshipDetailsTypes.ElementNodeData,
    | 'ports'
    | 'height'
  >
>

export const ElementPorts = ({ data: { ports, height: h } }: ElementPortsProps) => {
  return (
    <>
      {ports.in.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type="target"
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${15 + (i + 1) * ((h - 30) / (ports.in.length + 1))}px`,
          }} />
      ))}
      {ports.out.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={Position.Right}
          style={{
            visibility: 'hidden',
            top: `${15 + (i + 1) * ((h - 30) / (ports.out.length + 1))}px`,
          }} />
      ))}
    </>
  )
}
type CompoundPortsProps = NodeProps<
  Pick<
    RelationshipDetailsTypes.CompoundNodeData,
    'ports'
  >
>

export const CompoundPorts = ({ data }: CompoundPortsProps) => (
  <>
    {data.ports.in.map((id, i) => (
      <Handle
        key={id}
        id={id}
        type="target"
        position={Position.Left}
        style={{
          visibility: 'hidden',
          top: `${20 * (i + 1)}px`,
        }} />
    ))}
    {data.ports.out.map((id, i) => (
      <Handle
        key={id}
        id={id}
        type="source"
        position={Position.Right}
        style={{
          visibility: 'hidden',
          top: `${20 * (i + 1)}px`,
        }} />
    ))}
  </>
)
