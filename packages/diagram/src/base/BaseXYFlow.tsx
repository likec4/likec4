// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { cx } from '@likec4/styles/css'
import { useMantineColorScheme } from '@mantine/core'
import {
  type ReactFlowProps,
  type ReactFlowState,
  Controls,
  ReactFlow,
  useStore,
} from '@xyflow/react'
import { type KeyboardEvent, useMemo } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import { useCallbackRef } from '../hooks/useCallbackRef'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useIsZoomTooSmall, useXYFlow, useXYStoreApi } from '../hooks/useXYFlow'
import type { ViewPadding } from '../LikeC4Diagram.props'
import { roundDpr } from '../utils/roundDpr'
import { stopPropagation } from '../utils/xyflow'
import { type XYBackground, Background } from './Background'
import { Base } from './Base'
import { MaxZoom, MinZoom } from './const'
import { getKeyboardZoomAction } from './keyboardZoom'
import type { BaseEdge, BaseNode } from './types'

// React Flow renders a single, shared description element that every node (and
// every edge) references via `aria-describedby`, so this wording must hold for
// any focusable element. Enter/Space always selects the focused element and
// reveals its contextual actions; per-element `aria-label`s describe what those
// actions do (e.g. "Opens view ...").
const likec4AriaLabelConfig = {
  'node.a11yDescription.default': 'Press Enter or Space to select this node and reveal its actions.',
  'node.a11yDescription.keyboardDisabled': 'Keyboard activation is disabled.',
  'edge.a11yDescription.default': 'Press Enter or Space to select this relationship and reveal its actions.',
}

function activateFocusedElement(event: KeyboardEvent) {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) {
    return
  }
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }
  const interactive = target.closest(
    'a,button,input,textarea,select,[role="button"],[role="link"],[contenteditable="true"]',
  )
  if (
    interactive
    && !interactive.classList.contains('react-flow__node')
    && !interactive.classList.contains('react-flow__edge')
  ) {
    return
  }
  const flowElement = target.closest<HTMLElement | SVGElement>(
    '.react-flow__node[data-id], .react-flow__edge[data-id]',
  )
  const view = flowElement?.ownerDocument.defaultView
  if (!flowElement || !view) {
    return
  }
  event.preventDefault()
  // Keep propagation so React Flow still updates selection and aria-live state.
  const rect = flowElement.getBoundingClientRect()
  flowElement.dispatchEvent(
    new view.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      detail: 1,
      view,
    }),
  )
}

export type BaseXYFlowProps<NodeType extends BaseNode, EdgeType extends BaseEdge> = Simplify<
  & {
    pannable: boolean
    zoomable: boolean
    nodesSelectable: boolean
    nodesDraggable: boolean
    showControls?: boolean
    background?: 'transparent' | 'solid' | XYBackground
    fitViewPadding?: ViewPadding | undefined
    onViewportResize?: undefined | (() => void)
  }
  & SetRequired<
    Omit<
      ReactFlowProps<NodeType, EdgeType>,
      // Omited props
      | 'defaultNodes'
      | 'defaultEdges'
      | 'fitViewOptions'
      | 'nodesSelectable'
      | 'nodesDraggable'
    >,
    // Required props
    | 'nodes'
    | 'edges'
    | 'onNodesChange'
    | 'onEdgesChange'
  >
>

export function BaseXYFlow<
  NodeType extends BaseNode,
  EdgeType extends BaseEdge,
>(
  {
    nodes,
    edges,
    onEdgesChange,
    onNodesChange,
    className,
    pannable = true,
    zoomable = true,
    nodesSelectable = true,
    nodesDraggable = false,
    background = 'dots',
    children,
    colorMode,
    fitViewPadding = 0,
    fitView = true,
    zoomOnDoubleClick = false,
    onViewportResize,
    onMoveEnd,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
    onKeyDownCapture,
    ariaLabelConfig,
    nodesFocusable = nodesDraggable || nodesSelectable,
    edgesFocusable = false,
    showControls = false,
    ...props
  }: BaseXYFlowProps<NodeType, EdgeType>,
) {
  const fitViewOptions = useMemo(() => ({
    minZoom: MinZoom,
    maxZoom: 1,
    padding: fitViewPadding,
    includeHiddenNodes: false,
  }), [fitViewPadding])

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  const isZoomTooSmall = useIsZoomTooSmall()
  const xyflow = useXYFlow()
  const xystore = useXYStoreApi()
  const { colorScheme } = useMantineColorScheme()
  if (!colorMode) {
    colorMode = colorScheme === 'auto' ? 'system' : colorScheme
  }

  const tabIndex = props.tabIndex ?? (zoomable ? 0 : undefined)
  const hasAccessibleName = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined
  const ariaLabel = hasAccessibleName || tabIndex === undefined ? props['aria-label'] : 'Interactive diagram'

  const onKeyDown = useCallbackRef((event: KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event)
    if (event.defaultPrevented || !zoomable) {
      return
    }
    const action = getKeyboardZoomAction(event.nativeEvent)
    if (!action) {
      return
    }
    event.preventDefault()
    switch (action) {
      case 'zoom-in':
        void xyflow.zoomIn()
        return
      case 'zoom-out':
        void xyflow.zoomOut()
        return
      case 'reset':
        void xyflow.fitView(fitViewOptions)
        return
    }
  })

  return (
    <ReactFlow<NodeType, EdgeType>
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      className={cx(
        background === 'transparent' && 'bg-transparent',
        className,
      )}
      {...isZoomTooSmall && {
        ['data-likec4-zoom-small']: true,
      }}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null,
      })}
      zoomOnDoubleClick={zoomOnDoubleClick}
      maxZoom={zoomable ? MaxZoom : 1}
      minZoom={zoomable ? MinZoom : 1}
      fitView={fitView}
      fitViewOptions={fitViewOptions}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      noWheelClassName="nowheel"
      panOnScroll={pannable}
      panOnDrag={pannable}
      {...(!pannable && {
        panActivationKeyCode: null,
        selectionKeyCode: null,
      })}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesFocusable}
      edgesFocusable={edgesFocusable}
      nodesDraggable={nodesDraggable}
      ariaLabelConfig={{
        ...likec4AriaLabelConfig,
        ...ariaLabelConfig,
      }}
      nodeDragThreshold={4}
      nodeClickDistance={3}
      paneClickDistance={3}
      elevateNodesOnSelect={false} // or edges are not visible after select\
      selectNodesOnDrag={false}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onMoveEnd={useCallbackRef((event, { x, y, zoom }) => {
        /**
         * WORKAROUND
         * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
         * https://github.com/xyflow/xyflow/issues/3282
         * https://github.com/likec4/likec4/issues/734
         */
        const roundedX = roundDpr(x), roundedY = roundDpr(y)
        if (x !== roundedX || y !== roundedY) {
          xystore.setState({ transform: [roundedX, roundedY, zoom] })
        }
        onMoveEnd?.(event, { x: roundedX, y: roundedY, zoom })
      })}
      onNodeMouseEnter={useCallbackRef((event, node) => {
        if (onNodeMouseEnter) {
          onNodeMouseEnter(event, node)
          return
        }
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: Base.setHovered(node, true),
        }])
      })}
      onNodeMouseLeave={useCallbackRef((event, node) => {
        if (onNodeMouseLeave) {
          onNodeMouseLeave(event, node)
          return
        }
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: Base.setHovered(node, false),
        }])
      })}
      onEdgeMouseEnter={useCallbackRef((event, edge) => {
        if (onEdgeMouseEnter) {
          onEdgeMouseEnter(event, edge)
          return
        }
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: Base.setHovered(edge, true),
        }])
      })}
      onEdgeMouseLeave={useCallbackRef((event, edge) => {
        if (onEdgeMouseLeave) {
          onEdgeMouseLeave(event, edge)
          return
        }
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: Base.setHovered(edge, false),
        }])
      })}
      onNodeDoubleClick={stopPropagation}
      onEdgeDoubleClick={stopPropagation}
      onKeyDownCapture={useCallbackRef((event) => {
        onKeyDownCapture?.(event)
        if (!event.defaultPrevented) {
          activateFocusedElement(event)
        }
      })}
      {...props}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {isBgWithPattern && <Background background={background} />}
      {onViewportResize && <ViewportResizeHanlder onViewportResize={onViewportResize} />}
      {children}
    </ReactFlow>
  )
}

const selectDimensions = ({ width, height }: ReactFlowState) => (width || 1) * (height || 1)

const ViewportResizeHanlder = ({
  onViewportResize,
}: {
  onViewportResize: () => void
}) => {
  const square = useStore(selectDimensions)
  useUpdateEffect(onViewportResize, [square])

  return null
}
