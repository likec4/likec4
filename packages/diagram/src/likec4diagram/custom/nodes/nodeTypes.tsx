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
  ElementTitle,
} from '../../../base/primitives'
import { IfEnabled, IfNotReadOnly, useEnabledFeatures } from '../../../context/DiagramFeatures'
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

export const ElementNode = customNode<Types.ElementNodeData, 'element'>((props) => (
  <ElementNodeContainer nodeProps={props}>
    <ElementShape {...props} />
    <ElementTitle {...props} />
    <ElementActions {...props} />
    <ElementDetailsButtonWithHandler {...props} />
    <IfNotReadOnly>
      <ElementToolbar {...props} />
    </IfNotReadOnly>
    <DefaultHandles />
  </ElementNodeContainer>
))
ElementNode.displayName = 'ElementNode'

export const DeploymentNode = customNode<Types.DeploymentElementNodeData, 'deployment'>((props) => (
  <ElementNodeContainer nodeProps={props}>
    <ElementShape {...props} />
    <ElementTitle {...props} />
    <DeploymentElementActions {...props} />
    <ElementDetailsButtonWithHandler {...props} />
    <IfNotReadOnly>
      <DeploymentElementToolbar {...props} />
    </IfNotReadOnly>
    <DefaultHandles />
  </ElementNodeContainer>
))
DeploymentNode.displayName = 'DeploymentNode'

export const CompoundElementNode = customNode<Types.CompoundElementNodeData, 'compound-element'>((props) => {
  const diagram = useDiagram()

  return (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      <IfEnabled feature="ElementDetails">
        <CompoundDetailsButton
          {...props}
          onClick={e => {
            e.stopPropagation()
            diagram.openElementDetails(props.data.modelFqn, props.id as NodeId)
          }} />
      </IfEnabled>
      <IfNotReadOnly>
        <CompoundElementToolbar {...props} />
      </IfNotReadOnly>
      <DefaultHandles />
    </CompoundNodeContainer>
  )
})
CompoundElementNode.displayName = 'CompoundElementNode'

export const CompoundDeploymentNode = customNode<Types.CompoundDeploymentNodeData, 'compound-deployment'>((props) => (
  <CompoundNodeContainer nodeProps={props}>
    <CompoundTitle {...props} />
    <CompoundActions {...props} />
    <IfNotReadOnly>
      <CompoundDeploymentToolbar {...props} />
    </IfNotReadOnly>
    <DefaultHandles />
  </CompoundNodeContainer>
))
CompoundDeploymentNode.displayName = 'CompoundDeploymentNode'

export const ViewGroupNode = customNode<Types.ViewGroupNodeData, 'view-group'>((props) => (
  <CompoundNodeContainer nodeProps={props}>
    <CompoundTitle {...props} />
    <DefaultHandles />
  </CompoundNodeContainer>
))
ViewGroupNode.displayName = 'ViewGroupNode'
