import {
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../../../base/primitives'
import { ElementActions } from './ElementActions'

import type { Fqn } from '@likec4/core'
import { Handle } from '@xyflow/react'
import { Position } from '@xyflow/system'
import type { NodeProps } from '../../../base'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes } from '../_types'

const ElementDetailsButtonWithHandler = (
  { fqn, ...props }: NodeProps<RelationshipDetailsTypes.NodeData> & { fqn: Fqn },
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
  element: customNode<RelationshipDetailsTypes.ElementNodeData>((props) => {
    return (
      <ElementNodeContainer nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props} fqn={props.data.fqn} />
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
        <ElementDetailsButtonWithHandler {...props} fqn={props.data.fqn} />
        <CompoundTitle {...props} />
        <CompoundPorts {...props} />
      </CompoundNodeContainer>
    )
  }),
} satisfies {
  [key in RelationshipDetailsTypes.Node['type']]: any
}

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
