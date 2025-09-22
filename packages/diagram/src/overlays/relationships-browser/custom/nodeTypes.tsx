import { Handle, Position } from '@xyflow/react'
import type { BaseNodePropsWithData } from '../../../base'
import {
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  ElementData,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags,
} from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes } from '../_types'
import { ElementActions } from './ElementActions'

const ElementDetailsButtonWithHandler = (
  props: RelationshipsBrowserTypes.NodeProps<'element' | 'compound'>,
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

export function ElementNode(props: RelationshipsBrowserTypes.NodeProps<'element'>) {
  const { enableElementTags } = useEnabledFeatures()
  return (
    <ElementNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementDetailsButtonWithHandler {...props} />
      <ElementActions {...props} />
      <ElementPorts {...props} />
    </ElementNodeContainer>
  )
}

export function CompoundNode(props: RelationshipsBrowserTypes.NodeProps<'compound'>) {
  const diagram = useDiagram()
  return (
    <CompoundNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <CompoundTitle {...props} />
      <CompoundDetailsButton
        {...props}
        onClick={e => {
          e.stopPropagation()
          diagram.openElementDetails(props.data.fqn)
        }} />
      <CompoundPorts {...props} />
    </CompoundNodeContainer>
  )
}

type ElementPortsProps = BaseNodePropsWithData<
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
type CompoundPortsProps = BaseNodePropsWithData<
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
