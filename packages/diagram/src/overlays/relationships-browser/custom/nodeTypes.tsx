import { Handle } from '@xyflow/react'
import { Position } from '@xyflow/system'
import type { NodeProps } from '../../../base'
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
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes } from '../_types'
import { ElementActions } from './ElementActions'
import { EmptyNode as EmptyNodeRender } from './EmptyNode'

const ElementDetailsButtonWithHandler = (
  props: NodeProps<RelationshipsBrowserTypes.ElementNodeData | RelationshipsBrowserTypes.CompoundNodeData>,
) => {
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

export const ElementNode = customNode<RelationshipsBrowserTypes.ElementNodeData>((props) => {
  const { enableElementTags } = useEnabledFeatures()
  return (
    <ElementNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementDetailsButtonWithHandler {...props} />
      <ElementActions {...props} />
      <ElementPorts {...props} />
    </ElementNodeContainer>
  )
})

export const CompoundNode = customNode<RelationshipsBrowserTypes.CompoundNodeData>((props) => {
  return (
    <CompoundNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <ElementDetailsButtonWithHandler {...props} />
      <CompoundTitle {...props} />
      <CompoundPorts {...props} />
    </CompoundNodeContainer>
  )
})

export const EmptyNode = customNode<RelationshipsBrowserTypes.EmptyNodeData>((props) => {
  return <EmptyNodeRender {...props} />
})

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
