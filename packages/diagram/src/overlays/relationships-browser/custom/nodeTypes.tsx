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
import { useOverlays } from '../../../hooks/useOverlays'
import type { RelationshipsBrowserTypes } from '../_types'
import { ElementActions } from './ElementActions'
import { EmptyNode } from './EmptyNode'

const ElementDetailsButtonWithHandler = (props: NodeProps<RelationshipsBrowserTypes.ElementNodeData | RelationshipsBrowserTypes.CompoundNodeData>) => {
  const overlays = useOverlays()

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        overlays.openElementDetails(props.data.fqn)
      }}
    />
  )
}

export const nodeTypes = {
  element: customNode<RelationshipsBrowserTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer key={props.id} component={m.div} layoutId={props.id} nodeProps={props}>
        <ElementShape {...props} />
        <ElementTitle {...props} iconSize={40} />
        <ElementDetailsButtonWithHandler {...props} />
        <ElementActions {...props} />
        <ElementPorts {...props} />
      </ElementNodeContainer>
    )
  }),

  compound: customNode<RelationshipsBrowserTypes.CompoundNodeData>((props) => {
    return (
      <CompoundNodeContainer key={props.id} component={m.div} layoutId={props.id} nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props}/>
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
