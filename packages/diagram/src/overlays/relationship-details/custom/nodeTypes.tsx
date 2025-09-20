import {
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags,
  ElementTitle,
} from '../../../base/primitives'
import { ElementActions } from './ElementActions'

import { Handle } from '@xyflow/react'
import { Position } from '@xyflow/system'
import type { BaseNodePropsWithData } from '../../../base'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes } from '../_types'

const ElementDetailsButtonWithHandler = (props: BaseNodePropsWithData<RelationshipDetailsTypes.NodeData>) => {
  const diagram = useDiagram()

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(props.data.fqn)
      }}
    />
  )
}

export const ElementNode = customNode<RelationshipDetailsTypes.NodeProps<'element'>>((props) => {
  const { enableElementTags } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementDetailsButtonWithHandler {...props} />
      <ElementActions {...props} />
      <ElementPorts {...props} />
    </ElementNodeContainer>
  )
})

export const CompoundNode = customNode<RelationshipDetailsTypes.NodeProps<'compound'>>(
  (props) => {
    return (
      <CompoundNodeContainer nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props} />
        <CompoundTitle {...props} />
        <CompoundPorts {...props} />
      </CompoundNodeContainer>
    )
  },
)

type ElementPortsProps = BaseNodePropsWithData<
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
type CompoundPortsProps = BaseNodePropsWithData<
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
