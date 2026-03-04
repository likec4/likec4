// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Fqn, NodeId } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { IconMessageCircle } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { MouseEvent as ReactMouseEvent } from 'react'
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
import { stopPropagation } from '../../../utils/xyflow'
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

const aiChatBtnVariants = {
  normal: {
    originX: 0.4,
    originY: 0.6,
    scale: 1,
    opacity: 0.5,
  },
  hovered: {
    originX: 0.4,
    originY: 0.6,
    scale: 1.25,
    opacity: 0.9,
  },
  selected: {
    originX: 0.4,
    originY: 0.6,
    scale: 1.25,
    opacity: 0.9,
  },
  whileHover: {
    scale: 1.4,
    opacity: 1,
  },
  whileTap: {
    scale: 1.15,
  },
}

const aiChatBtnContainer = css({
  position: 'absolute',
  top: '[30px]',
  right: '0.5',
  _shapeBrowser: {
    right: '[5px]',
  },
  _shapeCylinder: {
    top: '[44px]',
  },
  _shapeStorage: {
    top: '[44px]',
  },
  _shapeQueue: {
    top: '[31px]',
    right: '3',
  },
  _smallZoom: {
    display: 'none',
  },
  _print: {
    display: 'none',
  },
})

function AIChatButtonWithHandler(
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

  const isHovered = props.data.hovered ?? false
  let variant: keyof typeof aiChatBtnVariants
  switch (true) {
    case isHovered:
      variant = 'hovered'
      break
    case props.selected:
      variant = 'selected'
      break
    default:
      variant = 'normal'
  }

  return (
    <div className={cx(aiChatBtnContainer, 'ai-chat-button')}>
      <ActionIcon
        className={cx(
          'nodrag nopan',
          actionBtn({ variant: 'transparent' }),
        )}
        component={m.button}
        initial={false}
        variants={aiChatBtnVariants}
        animate={variant}
        whileHover="whileHover"
        whileTap="whileTap"
        onClick={(e: ReactMouseEvent) => {
          e.stopPropagation()
          diagram.openAIChat(fqn)
        }}
        onDoubleClick={stopPropagation}
        tabIndex={-1}
        aria-label="Open AI Chat"
      >
        <IconMessageCircle stroke={1.8} style={{ width: '75%' }} />
      </ActionIcon>
    </div>
  )
}

/**
 * Renders an element node.
 */
export function ElementNode(props: Types.NodeProps<'element'>) {
  const {
    enableElementTags,
    enableElementDetails,
    enableReadOnly,
    enableCompareWithLatest,
    enableNotes,
    enableAIChat,
  } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <ElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {enableAIChat && <AIChatButtonWithHandler {...props} />}
      {!enableReadOnly && <ElementToolbar {...props} />}
      {enableNotes && <NodeNotes {...props} />}
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </ElementNodeContainer>
  )
}

export function DeploymentNode(props: Types.NodeProps<'deployment'>) {
  const {
    enableElementTags,
    enableElementDetails,
    enableReadOnly,
    enableCompareWithLatest,
    enableNotes,
    enableAIChat,
  } = useEnabledFeatures()
  return (
    <ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <ElementShape {...props} />
      <ElementData {...props} />
      {enableElementTags && <ElementTags {...props} />}
      <DeploymentElementActions {...props} />
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
      {enableAIChat && <AIChatButtonWithHandler {...props} />}
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
