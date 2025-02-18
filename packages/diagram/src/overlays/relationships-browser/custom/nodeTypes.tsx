import type { Fqn, NodeId } from '@likec4/core'
import { Handle } from '@xyflow/react'
import { Position } from '@xyflow/system'
import { m } from 'framer-motion'
import type { NodeProps } from '../../../base'
import {
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../../../base/primitives'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes } from '../_types'
import { ElementActions } from './ElementActions'
import { EmptyNode } from './EmptyNode'

const ElementDetailsButtonWithHandler = (
  { fqn, ...props }: NodeProps<RelationshipsBrowserTypes.NodeData> & { fqn: Fqn },
) => {
  const { enableElementDetails } = useEnabledFeature('ElementDetails')
  const diagram = useDiagram()

  if (!enableElementDetails) return null

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn)
      }}
    />
  )
}

export const nodeTypes = {
  element: customNode<RelationshipsBrowserTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer key={props.id} component={m.div} layoutId={props.id} nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props} fqn={props.data.fqn} />
        <ElementShape {...props} />
        <ElementTitle {...props} iconSize={40} />
        <ElementActions {...props} />
        <ElementPorts {...props} />
      </ElementNodeContainer>
    )
  }),

  compound: customNode<RelationshipsBrowserTypes.CompoundNodeData>((props) => {
    return (
      <CompoundNodeContainer key={props.id} component={m.div} layoutId={props.id} nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props} fqn={props.data.fqn} />
        <CompoundTitle {...props} />
        <CompoundPorts {...props} />
      </CompoundNodeContainer>
    )
  }),
  empty: customNode<RelationshipsBrowserTypes.EmptyNodeData>((props) => {
    return <EmptyNode {...props} />
  }),
} satisfies { [key in RelationshipsBrowserTypes.Node['type']]: any }

type ElementPortsProps = NodeProps<
  Pick<
    RelationshipsBrowserTypes.ElementNodeData,
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
    RelationshipsBrowserTypes.CompoundNodeData,
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
