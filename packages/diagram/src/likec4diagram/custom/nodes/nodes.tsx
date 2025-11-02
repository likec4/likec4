import type { NodeId } from '@likec4/core'
import {
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementData,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags,
} from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions, ElementActions } from './ElementActions'
import { ElementNodeDrifts } from './ElementNodeDrifts'
import { CompoundDeploymentToolbar, CompoundElementToolbar } from './toolbar/CompoundToolbar'
import { DeploymentElementToolbar, ElementToolbar } from './toolbar/ElementToolbar'

export function ElementDetailsButtonWithHandler(
  props: Pick<Types.NodeProps<'element' | 'deployment'>, 'id' | 'data'>,
) {
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!fqn) return null

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
  props: Types.NodeProps<'compound-deployment' | 'compound-element'>,
) {
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!fqn) return null

  return (
    <CompoundDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }} />
  )
}

/**
 * Renders an element node.
 */
export function ElementNode(props: Types.NodeProps<'element'>) {
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <ElementNodeDrifts {...props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <ElementToolbar {...props} />}
      <DefaultHandles />
    </ElementNodeContainer>
  )
}

export function DeploymentNode(props: Types.NodeProps<'deployment'>) {
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <ElementNodeDrifts {...props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <DeploymentElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <DeploymentElementToolbar {...props} />}
      <DefaultHandles />
    </ElementNodeContainer>
  )
}

export function CompoundElementNode(props: Types.NodeProps<'compound-element'>) {
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
}

export function CompoundDeploymentNode(props: Types.NodeProps<'compound-deployment'>) {
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
}

export function ViewGroupNode(props: Types.NodeProps<'view-group'>) {
  return (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <DefaultHandles />
    </CompoundNodeContainer>
  )
}
