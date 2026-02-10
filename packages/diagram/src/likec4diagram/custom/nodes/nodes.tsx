import type { Fqn, NodeId } from '@likec4/core'
import { css } from '@likec4/styles/css'
import {
  type ElementTagsProps,
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementData,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags as ElementTagsPrimitive,
} from '../../../base-primitives'
import type { BaseNodeData } from '../../../base/types'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useCallbackRef } from '../../../hooks'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions, ElementActions } from './ElementActions'
import { NodeDrifts } from './NodeDrifts'
import { NodeNotes } from './NodeNotes'
import { CompoundDeploymentToolbar, CompoundElementToolbar } from './toolbar/CompoundToolbar'
import { DeploymentElementToolbar, ElementToolbar } from './toolbar/ElementToolbar'

function ElementTags(props: ElementTagsProps) {
  const diagram = useDiagram()

  return (
    <ElementTagsPrimitive
      onTagClick={useCallbackRef((tag) => {
        diagram.openSearch(tag)
      })}
      onTagMouseEnter={useCallbackRef((tag) => {
        diagram.send({ type: 'tag.highlight', tag })
      })}
      onTagMouseLeave={useCallbackRef((_tag) => {
        diagram.send({ type: 'tag.unhighlight' })
      })}
      {...props}
    />
  )
}

export function ElementDetailsButtonWithHandler(
  props: {
    id: string
    selected?: boolean
    data: BaseNodeData & {
      modelFqn?: Fqn | null | undefined
    }
  },
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
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest, enableNotes } =
    useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <ElementToolbar {...props} />}
      {enableNotes && <NodeNotes {...props} />}
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </ElementNodeContainer>
  )
}

export function DeploymentNode(props: Types.NodeProps<'deployment'>) {
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest, enableNotes } =
    useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <DeploymentElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <DeploymentElementToolbar {...props} />}
      {enableNotes && <NodeNotes {...props} />}
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </ElementNodeContainer>
  )
}

const compoundHasDrifts = css({
  outlineColor: 'likec4.compare.manual.outline',
  outlineWidth: '4px',
  outlineStyle: 'dashed',
  outlineOffset: '1.5',
})

const hasDrifts = (props: Types.NodeProps) => {
  return props.data.drifts && props.data.drifts.length > 0
}

export function CompoundElementNode(props: Types.NodeProps<'compound-element'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <CompoundNodeContainer
      className={showDrifts ? compoundHasDrifts : undefined}
      nodeProps={props}
    >
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <CompoundElementToolbar {...props} />}
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </CompoundNodeContainer>
  )
}

export function CompoundDeploymentNode(props: Types.NodeProps<'compound-deployment'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <CompoundNodeContainer
      className={showDrifts ? compoundHasDrifts : undefined}
      nodeProps={props}
    >
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
      {!enableReadOnly && <CompoundDeploymentToolbar {...props} />}
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </CompoundNodeContainer>
  )
}

export function ViewGroupNode(props: Types.NodeProps<'view-group'>) {
  const { enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <CompoundNodeContainer
      className={showDrifts ? compoundHasDrifts : undefined}
      nodeProps={props}
    >
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <CompoundTitle {...props} />
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </CompoundNodeContainer>
  )
}
