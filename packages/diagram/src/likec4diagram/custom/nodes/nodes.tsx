import { type NodeId } from '@likec4/core'
import type { NodeProps } from '../../../base'
import {
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  DefaultHandles,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags,
  ElementTitle,
} from '../../../base/primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions, ElementActions } from './ElementActions'
import { CompoundDeploymentToolbar, CompoundElementToolbar } from './toolbar/CompoundToolbar'
import { DeploymentElementToolbar, ElementToolbar } from './toolbar/ElementToolbar'

export function ElementDetailsButtonWithHandler(
  props: NodeProps<Types.ElementNodeData | Types.DeploymentElementNodeData>,
) {
  const { enableElementDetails } = useEnabledFeatures()
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!enableElementDetails || !fqn) return null

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }} />
  )
}

export function CompoundDetailsButtonWithHandler(
  props: NodeProps<Types.CompoundElementNodeData | Types.CompoundDeploymentNodeData>,
) {
  const { enableElementDetails } = useEnabledFeatures()
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!enableElementDetails || !fqn) return null

  return (
    <CompoundDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }} />
  )
}

export const ElementNode = customNode<Types.ElementNodeData, 'element'>(props => {
  const { enableElementTags, enableReadOnly } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementActions {...props} />
      <ElementDetailsButtonWithHandler {...props} />
      {!enableReadOnly && <ElementToolbar {...props} />}
      <DefaultHandles />
    </ElementNodeContainer>
  )
})
ElementNode.displayName = 'ElementNode'

export const DeploymentNode = customNode<Types.DeploymentElementNodeData, 'deployment'>((props) => {
  const { enableElementTags, enableReadOnly } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <DeploymentElementActions {...props} />
      <ElementDetailsButtonWithHandler {...props} />
      {!enableReadOnly && <DeploymentElementToolbar {...props} />}
      <DefaultHandles />
    </ElementNodeContainer>
  )
})
DeploymentNode.displayName = 'DeploymentNode'

export const CompoundElementNode = customNode<Types.CompoundElementNodeData, 'compound-element'>((props) => {
  const { enableElementDetails, enableReadOnly } = useEnabledFeatures()
  return (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <CompoundElementToolbar {...props} />}
      <DefaultHandles />
    </CompoundNodeContainer>
  )
})
CompoundElementNode.displayName = 'CompoundElementNode'

export const CompoundDeploymentNode = customNode<Types.CompoundDeploymentNodeData, 'compound-deployment'>((props) => {
  const { enableElementDetails, enableReadOnly } = useEnabledFeatures()
  return (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <CompoundDeploymentToolbar {...props} />}
      <DefaultHandles />
    </CompoundNodeContainer>
  )
})
CompoundDeploymentNode.displayName = 'CompoundDeploymentNode'

export const ViewGroupNode = customNode<Types.ViewGroupNodeData, 'view-group'>((props) => (
  <CompoundNodeContainer nodeProps={props}>
    <CompoundTitle {...props} />
    <DefaultHandles />
  </CompoundNodeContainer>
))
ViewGroupNode.displayName = 'ViewGroupNode'
