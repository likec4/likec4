// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Fqn, ViewId } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import {
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react'
import { getBezierPath } from '@xyflow/system'
import { useMemo } from 'react'
import {
  CompoundNodeContainer,
  CompoundTitle,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  ElementData,
  ElementNodeContainer,
  ElementShape,
  memoEdge,
} from './base-primitives'
import type { XYBackground } from './base/Background'
import { BaseXYFlow } from './base/BaseXYFlow'
import type { BaseNodePropsWithData } from './base/types'
import { RootContainer } from './components/RootContainer'
import {
  EnsureMantine,
  FramerMotionConfig,
} from './context'
import { TagStylesProvider } from './context/TagStylesContext'
import { useId } from './hooks/useId'
import { LikeC4Styles } from './LikeC4Styles'
import type { RelationshipsBrowserTypes } from './overlays/relationships-browser/_types'
import { EmptyNode } from './overlays/relationships-browser/custom/EmptyNode'
import { useRelationshipsView } from './overlays/relationships-browser/layout'
import {
  useViewToNodesEdges,
  viewToNodesEdge,
} from './overlays/relationships-browser/useViewToNodesEdges'

type StaticRelationshipsBrowserNode = RelationshipsBrowserTypes.AnyNode
type StaticRelationshipsBrowserEdge = RelationshipsBrowserTypes.Edge

const RELATIONSHIP_LABEL_HORIZONTAL_PADDING = 70
const RELATIONSHIP_LABEL_MAX_WIDTH = 250

export function relationshipEdgeLabelMaxWidth(sourceX: number, targetX: number): number {
  return Math.min(
    Math.max(Math.abs(targetX - sourceX) - RELATIONSHIP_LABEL_HORIZONTAL_PADDING, 0),
    RELATIONSHIP_LABEL_MAX_WIDTH,
  )
}

export type StaticRelationshipsBrowserView =
  & ReturnType<typeof useRelationshipsView>
  & ReturnType<typeof viewToNodesEdge>

export type StaticRelationshipsBrowserInstance = ReactFlowInstance<
  StaticRelationshipsBrowserNode,
  StaticRelationshipsBrowserEdge
>

export type StaticRelationshipsBrowserProps = {
  view: StaticRelationshipsBrowserView
  className?: string | undefined
  background?: 'transparent' | 'solid' | XYBackground | undefined
  initialViewport?: { x: number; y: number; zoom: number } | undefined
  onInitialized?: ((instance: StaticRelationshipsBrowserInstance) => void) | undefined
}

/**
 * Computes the same relationship-browser view model used by the interactive overlay.
 */
export function useStaticRelationshipsBrowserView(
  subject: Fqn,
  viewId: ViewId | null,
  scope: 'global' | 'view',
): StaticRelationshipsBrowserView {
  const layouted = useRelationshipsView(subject, viewId, scope)
  const {
    xynodes,
    xyedges,
  } = useViewToNodesEdges(layouted)

  return useMemo(
    () => ({
      ...layouted,
      xynodes,
      xyedges,
    }),
    [layouted, xynodes, xyedges],
  )
}

const nodeTypes: RelationshipsBrowserTypes.NodeRenderers = {
  element: StaticElementNode,
  compound: StaticCompoundNode,
  empty: EmptyNode,
}

const ignoreNodeChanges: OnNodesChange<StaticRelationshipsBrowserNode> = () => {}
const ignoreEdgeChanges: OnEdgesChange<StaticRelationshipsBrowserEdge> = () => {}

/**
 * Renders relationship-browser visuals without interactive browser controls.
 */
export function StaticRelationshipsBrowser({
  view,
  className,
  background = 'dots',
  initialViewport,
  onInitialized,
}: StaticRelationshipsBrowserProps) {
  const id = useId()
  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <LikeC4Styles id={id} />
        <TagStylesProvider rootSelector={`#${id}`}>
          <RootContainer id={id} className={cx('likec4-static-view', className)}>
            <ReactFlowProvider initialNodes={view.xynodes} initialEdges={view.xyedges}>
              <BaseXYFlow<StaticRelationshipsBrowserNode, StaticRelationshipsBrowserEdge>
                nodes={view.xynodes}
                edges={view.xyedges}
                className="initialized relationships-browser"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView={false}
                {...initialViewport && {
                  defaultViewport: initialViewport,
                }}
                {...onInitialized && {
                  onInit: onInitialized,
                }}
                onNodesChange={ignoreNodeChanges}
                onEdgesChange={ignoreEdgeChanges}
                nodesDraggable={false}
                nodesSelectable={false}
                nodesFocusable={false}
                edgesFocusable={false}
                pannable={false}
                zoomable={false}
                background={background}
                aria-label="Relationship export"
              />
            </ReactFlowProvider>
          </RootContainer>
        </TagStylesProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}

function StaticElementNode(props: RelationshipsBrowserTypes.NodeProps<'element'>) {
  return (
    <ElementNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <ElementShape {...props} />
      <ElementData {...props} />
      <ElementPorts {...props} />
    </ElementNodeContainer>
  )
}

function StaticCompoundNode(props: RelationshipsBrowserTypes.NodeProps<'compound'>) {
  return (
    <CompoundNodeContainer key={props.id} layoutId={props.id} nodeProps={props}>
      <CompoundTitle {...props} />
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

function ElementPorts({ data: { ports, height } }: ElementPortsProps) {
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
            top: `${15 + (i + 1) * ((height - 30) / (ports.in.length + 1))}px`,
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
            top: `${15 + (i + 1) * ((height - 30) / (ports.out.length + 1))}px`,
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

function CompoundPorts({ data }: CompoundPortsProps) {
  return (
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
}

const StaticRelationshipEdge = memoEdge<RelationshipsBrowserTypes.EdgeProps>((props) => {
  const {
    data: {
      relations,
      existsInCurrentView,
    },
  } = props
  const [svgPath, labelX, labelY] = getBezierPath(props)
  const markOrange = relations.length > 1 || !existsInCurrentView
  const edgeProps: RelationshipsBrowserTypes.EdgeProps = markOrange
    ? {
      ...props,
      data: {
        ...props.data,
        color: 'amber',
      } satisfies RelationshipsBrowserTypes.EdgeData,
    }
    : props

  return (
    <EdgeContainer {...edgeProps}>
      <EdgePath
        edgeProps={edgeProps}
        svgPath={svgPath}
        {...markOrange && {
          strokeWidth: 5,
        }}
      />
      <EdgeLabelContainer
        edgeProps={edgeProps}
        labelPosition={{
          x: labelX,
          y: labelY,
          translate: 'translate(-50%, 0)',
        }}
        style={{
          maxWidth: relationshipEdgeLabelMaxWidth(props.sourceX, props.targetX),
        }}
      >
        <EdgeLabel
          edgeProps={edgeProps}
          className={css({
            transition: 'fast',
          })}
        />
      </EdgeLabelContainer>
    </EdgeContainer>
  )
})

const edgeTypes = {
  relationship: StaticRelationshipEdge,
}
