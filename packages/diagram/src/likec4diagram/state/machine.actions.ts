// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
import {
  BBox,
  invariant,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import type {
  DiagramView,
  Fqn,
  LayoutType,
  NodeId,
  NodeNotation as ElementNotation,
  XYPoint,
} from '@likec4/core/types'
import {
  getViewportForBounds,
} from '@xyflow/react'
import { type Rect, type Viewport, nodeToRect } from '@xyflow/system'
import { hasAtLeast, isNumber } from 'remeda'
import {
  assertEvent,
} from 'xstate'
import { Base, MinZoom } from '../../base'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { createLayoutConstraints } from '../useLayoutConstraints'
import { type AlignmentMode, getAligner, toNodeRect } from './aligners'
import {
  focusNodesEdges,
  mergeXYNodesEdges,
  resetEdgeControlPoints,
  updateActiveWalkthrough,
} from './assign'
import { createViewChange } from './createViewChange'
import { type Context, machine } from './machine.setup'
import {
  activeSequenceBounds,
  findDiagramEdge,
  findDiagramNode,
  focusedBounds,
  typedSystem,
} from './utils'

export function nodeRef(node: Types.Node) {
  switch (node.type) {
    case 'element':
    case 'compound-element':
    case 'seq-actor':
      return node.data.modelFqn
    case 'deployment':
    case 'compound-deployment':
      return node.data.modelFqn ?? node.data.deploymentFqn
    case 'seq-parallel':
    case 'view-group':
      return null
    default:
      nonexhaustive(node)
  }
}

export function findCorrespondingNode(context: Context, event: { view: DiagramView; xynodes: Types.Node[] }) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.xynodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.xynodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

export const trigger = {
  navigateTo: () =>
    machine.emit(({ context }) => ({
      type: 'navigateTo',
      viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
    })),
}

export const xyflow = {
  fitDiagram: (params?: { duration?: number; bounds?: BBox }) =>
    machine.createAction(({ context, event }) => {
      params ??= event.type === 'fitDiagram' ? event : {}
      const {
        bounds = context.view.bounds,
        duration = 450,
      } = params
      const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

      const maxZoom = Math.max(1, transform[2])
      const viewport = getViewportForBounds(
        bounds,
        width,
        height,
        MinZoom,
        maxZoom,
        context.fitViewPadding,
      )
      viewport.x = Math.round(viewport.x)
      viewport.y = Math.round(viewport.y)
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined).catch(
        console.error,
      )
    }),

  fitFocusedBounds: () =>
    machine.createAction(({ context }) => {
      const isActiveSequenceWalkthrough = !!context.activeWalkthrough && context.dynamicViewVariant === 'sequence'
      const { bounds, duration = 450 } = isActiveSequenceWalkthrough
        ? activeSequenceBounds({ context })
        : focusedBounds({ context })
      const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

      const maxZoom = Math.max(1, transform[2])
      const viewport = getViewportForBounds(
        bounds,
        width,
        height,
        MinZoom,
        maxZoom,
        context.fitViewPadding,
      )
      viewport.x = Math.round(viewport.x)
      viewport.y = Math.round(viewport.y)
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined)
    }),

  alignNodeFromToAfterNavigate: (params: { fromNode: NodeId; toPosition: XYPoint }) =>
    machine.createAction(({ context }) => {
      const xyflow = nonNullable(context.xyflow, 'xyflow is not initialized')
      const elFrom = xyflow.getInternalNode(params.fromNode)
      if (!elFrom) return
      const fromPos = xyflow.flowToScreenPosition({
          x: elFrom.internals.positionAbsolute.x,
          y: elFrom.internals.positionAbsolute.y,
        }),
        toPos = xyflow.flowToScreenPosition(params.toPosition),
        diff = {
          x: Math.round(fromPos.x - toPos.x),
          y: Math.round(fromPos.y - toPos.y),
        }
      context.xystore.getState().panBy(diff)
    }),

  setViewportCenter: (params?: { x: number; y: number }) =>
    machine.createAction(({ context, event }) => {
      let center: XYPoint
      if (params) {
        center = params
      } else if (event.type === 'update.view') {
        center = BBox.center(event.view.bounds)
      } else {
        center = BBox.center(context.view.bounds)
      }
      invariant(context.xyflow, 'xyflow is not initialized')
      const zoom = context.xyflow.getZoom()
      context.xyflow.setCenter(Math.round(center.x), Math.round(center.y), { zoom })
    }),

  setViewport: (params: { viewport: Viewport; duration?: number }) =>
    machine.createAction(({ context }) => {
      const {
        viewport,
        duration = 350,
      } = params
      const panZoom = context.xystore?.getState().panZoom
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined)
    }),
}

export const disableCompareWithLatest = () =>
  machine.assign(({ context }) => {
    return {
      toggledFeatures: {
        ...context.toggledFeatures,
        enableCompareWithLatest: false,
      },
      viewportOnAutoLayout: null,
      viewportOnManualLayout: null,
    }
  })

export const onEdgeDoubleClick = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'xyflow.edgeDoubleClick')
    if (!event.edge.data.controlPoints) {
      return {}
    }
    const { nodeLookup } = context.xystore.getState()
    return {
      xyedges: context.xyedges.map(e => {
        if (e.id === event.edge.id) {
          const controlPoints = resetEdgeControlPoints(nodeLookup, e)
          const pt = controlPoints[0]
          return {
            ...e,
            data: {
              ...e.data,
              controlPoints,
              labelBBox: e.data.labelBBox ? { ...e.data.labelBBox, ...pt } : null,
              labelXY: e.data.labelXY ? pt : null,
            },
          } as Types.Edge
        }
        return e
      }),
    }
  })

export const emitOnChange = () =>
  machine.enqueueActions(({ event, enqueue }) => {
    assertEvent(event, 'emit.onChange')
    enqueue.assign({
      viewportChangedManually: true,
    })
    enqueue.emit({
      type: 'onChange',
      change: event.change,
    })
  })

export const emitOnLayoutTypeChange = () =>
  machine.enqueueActions(({ event, system, context, enqueue }) => {
    if (!context.features.enableCompareWithLatest) {
      console.warn('Layout type cannot be changed while CompareWithLatest feature is disabled')
      return
    }
    const currentLayoutType = context.view._layout
    // toggle
    let nextLayoutType: LayoutType = currentLayoutType === 'auto' ? 'manual' : 'auto'

    if (event.type === 'emit.onLayoutTypeChange') {
      nextLayoutType = event.layoutType
    }

    if (currentLayoutType === nextLayoutType) {
      console.warn('Ignoring layout type change event, layout type is already', currentLayoutType)
      return
    }

    if (context.toggledFeatures.enableCompareWithLatest === true) {
      // Check if we are switching from manual to auto layout while a sync is pending
      if (currentLayoutType === 'manual' && nextLayoutType === 'auto') {
        const syncLayoutActor = typedSystem(system).syncLayoutActorRef
        const syncState = syncLayoutActor?.getSnapshot().value
        const isPending = syncLayoutActor && (syncState === 'pending' || syncState === 'paused')
        if (isPending) {
          enqueue.sendTo(syncLayoutActor, { type: 'cancel' })
          enqueue.emit({
            type: 'onChange',
            change: createViewChange(context),
          })
        }
      }

      const currentViewport = context.viewport
      if (currentLayoutType === 'auto') {
        enqueue.assign({
          viewportOnAutoLayout: currentViewport,
        })
      }
      if (currentLayoutType === 'manual') {
        enqueue.assign({
          viewportOnManualLayout: currentViewport,
        })
      }
    }

    enqueue.emit({
      type: 'onLayoutTypeChange',
      layoutType: nextLayoutType,
    })
  })

// Simple assign actions that don't depend on others
export const assignLastClickedNode = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'xyflow.nodeClick')
    const { lastClickedNode } = context
    if (!lastClickedNode || lastClickedNode.id !== event.node.id) {
      return {
        lastClickedNode: {
          id: event.node.id as NodeId,
          clicks: 1,
          timestamp: Date.now(),
        },
      }
    }
    return {
      lastClickedNode: {
        id: lastClickedNode.id,
        clicks: lastClickedNode.clicks + 1,
        timestamp: Date.now(),
      },
    }
  })

export const assignFocusedNode = () =>
  machine.assign(({ event }) => {
    let focusedNode
    switch (event.type) {
      case 'xyflow.nodeClick':
        focusedNode = event.node.data.id
        break
      case 'focus.node':
        focusedNode = event.nodeId
        break
      default:
        throw new Error(`Unexpected event type: ${event.type} in action 'assign: focusedNode'`)
    }
    return {
      focusedNode,
    }
  })

export const resetLastClickedNode = () =>
  machine.assign(() => ({
    lastClickedNode: null,
  }))

export const updateFeatures = () =>
  machine.assign(({ event }) => {
    assertEvent(event, 'update.features')
    return {
      features: { ...event.features },
    }
  })

export const updateInputs = () =>
  machine.assign(({ event }) => {
    assertEvent(event, 'update.inputs')
    return { ...event.inputs }
  })

export const updateXYNodesEdges = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'update.view')
    return {
      ...mergeXYNodesEdges({ context, event }),
      lastClickedNode: null,
    }
  })

export const focusOnNodesAndEdges = () => machine.assign(focusNodesEdges)

export const undimEverything = () =>
  machine.assign(({ context }) => ({
    xynodes: context.xynodes.map(Base.setDimmed(false)),
    xyedges: context.xyedges.map(Base.setData({
      dimmed: false,
      active: false,
    })),
  }))

export const updateActiveWalkthroughState = () => machine.assign(updateActiveWalkthrough)

export const assignDynamicViewVariant = () =>
  machine.assign(({ event }) => {
    assertEvent(event, 'switch.dynamicViewVariant')
    return {
      dynamicViewVariant: event.variant,
    }
  })

// Mouse event handlers with parameters
export const onNodeMouseEnter = (params?: { node: Types.Node }) =>
  machine.assign(({ context, event }) => {
    let node = params?.node
    if (!node) {
      assertEvent(event, 'xyflow.nodeMouseEnter')
      node = event.node
    }
    return {
      xynodes: context.xynodes.map(n => {
        if (n.id === node.id) {
          return Base.setHovered(n, true)
        }
        return n
      }),
    }
  })

export const onNodeMouseLeave = (params?: { node: Types.Node }) =>
  machine.assign(({ context, event }) => {
    let node = params?.node
    if (!node) {
      assertEvent(event, 'xyflow.nodeMouseLeave')
      node = event.node
    }
    return {
      xynodes: context.xynodes.map(n => {
        if (n.id === node.id) {
          return Base.setHovered(n, false)
        }
        return n
      }),
    }
  })

// Emit actions that don't depend on other actions
export const emitWalkthroughStopped = () =>
  machine.emit(() => ({
    type: 'walkthroughStopped',
  }))

export const emitPaneClick = () =>
  machine.emit(() => ({
    type: 'paneClick',
  }))

export const emitOpenSource = (params?: OpenSourceParams) =>
  machine.emit(({ event }) => {
    if (params) {
      return ({
        type: 'openSource',
        params,
      })
    }
    assertEvent(event, 'open.source')
    return {
      type: 'openSource',
      params: event,
    }
  })

export const emitInitialized = () =>
  machine.emit(({ context }) => {
    invariant(context.xyflow, 'XYFlow instance not found')
    return {
      type: 'initialized',
      instance: context.xyflow,
    }
  })

export const emitNodeClick = () =>
  machine.emit(({ context, event }) => {
    assertEvent(event, 'xyflow.nodeClick')
    const node = nonNullable(findDiagramNode(context, event.node.id), `Node ${event.node.id} not found in diagram`)
    return {
      type: 'nodeClick',
      node,
      xynode: event.node,
    }
  })

export const emitEdgeClick = () =>
  machine.emit(({ context, event }) => {
    assertEvent(event, 'xyflow.edgeClick')
    const edge = nonNullable(findDiagramEdge(context, event.edge.id), `Edge ${event.edge.id} not found in diagram`)
    return {
      type: 'edgeClick',
      edge,
      xyedge: event.edge,
    }
  })

export const emitWalkthroughStarted = () =>
  machine.emit(({ context }) => {
    const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
    invariant(edge, 'Invalid walkthrough state')
    return {
      type: 'walkthroughStarted',
      edge,
    }
  })

export const emitWalkthroughStep = () =>
  machine.emit(({ context }) => {
    const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
    invariant(edge, 'Invalid walkthrough state')
    return {
      type: 'walkthroughStep',
      edge,
    }
  })

export const layoutAlign = (params?: { mode: AlignmentMode }) =>
  machine.createAction(({ context, event }) => {
    let mode
    if (params) {
      mode = params.mode
    } else {
      assertEvent(event, 'layout.align')
      mode = event.mode
    }
    const xystore = nonNullable(context.xystore, 'xystore is not initialized')
    const { nodeLookup, parentLookup } = xystore.getState()

    const selectedNodes = new Set(nodeLookup.values().filter(n => n.selected).map(n => n.id))
    const nodesToAlign = [...selectedNodes.difference(new Set(parentLookup.keys()))]

    if (!hasAtLeast(nodesToAlign, 2)) {
      console.warn('At least 2 nodes must be selected to align')
      return
    }
    const constraints = createLayoutConstraints(xystore, nodesToAlign)
    const aligner = getAligner(mode)

    const nodes = nodesToAlign.map(id => ({
      node: nonNullable(nodeLookup.get(id)),
      rect: nonNullable(constraints.rects.get(id)),
    }))
    aligner.computeLayout(nodes.map(({ node }) => toNodeRect(node)))

    for (const { rect, node } of nodes) {
      rect.positionAbsolute = {
        ...rect.positionAbsolute,
        ...aligner.applyPosition(toNodeRect(node)),
      }
    }
    constraints.updateXYFlow()
  })

export const resetEdgesControlPoints = () =>
  machine.assign(({ context }) => {
    const { nodeLookup } = context.xystore.getState()
    return {
      xyedges: context.xyedges.map(edge => {
        if (!edge.data.controlPoints) {
          return edge
        }
        const controlPoints = resetEdgeControlPoints(nodeLookup, edge)
        const pt = controlPoints[0]
        return {
          ...edge,
          data: {
            ...edge.data,
            controlPoints,
            labelBBox: edge.data.labelBBox ? { ...edge.data.labelBBox, x: pt.x, y: pt.y } : null,
            labelXY: edge.data.labelXY ? pt : null,
          },
        } as Types.Edge
      }),
    }
  })

export const notationsHighlight = (params?: { notation: ElementNotation; kind?: string }) =>
  machine.assign(({ context, event }) => {
    if (!params) {
      assertEvent(event, 'notations.highlight')
      params = {
        ...event,
      }
    }
    const notation = params.notation
    const kinds = params.kind ? [params.kind] : notation.kinds
    const xynodes = context.xynodes.map((n) => {
      const node = findDiagramNode(context, n.id)
      if (
        node &&
        node.notation === notation.title &&
        node.shape === notation.shape &&
        node.color === notation.color &&
        kinds.includes(node.kind)
      ) {
        return Base.setDimmed(n, false)
      }
      return Base.setDimmed(n, 'immediate')
    })
    return {
      xynodes,
      xyedges: context.xyedges.map(Base.setDimmed('immediate')),
    }
  })

export const tagHighlight = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'tag.highlight')
    return {
      xynodes: context.xynodes.map((n) => {
        if (n.data.tags?.includes(event.tag)) {
          return Base.setDimmed(n, false)
        }
        return Base.setDimmed(n, true)
      }),
    }
  })

export const toggleFeature = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'toggle.feature')
    const currentValue = context.toggledFeatures[`enable${event.feature}`] ??
      context.features[`enable${event.feature}`]
    const nextValue = event.forceValue ?? !currentValue

    return {
      toggledFeatures: {
        ...context.toggledFeatures,
        [`enable${event.feature}`]: nextValue,
      },
    }
  })

// SendTo actions that don't depend on others
export const closeSearch = () =>
  machine.sendTo(
    ({ system }) => typedSystem(system).searchActorRef!,
    {
      type: 'close',
    },
  )

export const closeAllOverlays = () =>
  machine.sendTo(
    ({ system }) => typedSystem(system).overlaysActorRef!,
    {
      type: 'close.all',
    },
  )

const isReadOnly = (context: Context) =>
  context.features.enableReadOnly || context.toggledFeatures.enableReadOnly === true

export const stopSyncLayout = () =>
  machine.enqueueActions(({ enqueue, system }) => {
    const syncLayoutActor = typedSystem(system).syncLayoutActorRef
    if (!syncLayoutActor) return
    enqueue.stopChild(syncLayoutActor)
  })

export const ensureSyncLayout = () =>
  machine.enqueueActions(({ context, enqueue, system }) => {
    const syncLayoutActor = typedSystem(system).syncLayoutActorRef
    // Check if the context is read-only
    if (isReadOnly(context)) {
      if (syncLayoutActor) {
        enqueue.stopChild(syncLayoutActor)
      }
      return
    }
    if (syncLayoutActor) return
    enqueue.spawnChild('syncManualLayoutActorLogic', {
      id: 'syncLayout',
      systemId: 'syncLayout',
      input: {
        viewId: context.view.id,
      },
      syncSnapshot: true,
    })
  })

export const startEditing = (subject: 'node' | 'edge' = 'node') =>
  machine.sendTo(
    ({ system }) => typedSystem(system).syncLayoutActorRef!,
    {
      type: 'editing.start',
      subject,
    },
  )

export const stopEditing = (wasChanged = true) =>
  machine.sendTo(
    ({ system }) => typedSystem(system).syncLayoutActorRef!,
    {
      type: 'editing.stop',
      wasChanged,
    },
  )

export const openElementDetails = (params?: { fqn: Fqn; fromNode?: NodeId | undefined }) =>
  machine.enqueueActions(({ context, event, enqueue, system }) => {
    let initiatedFrom = null as null | {
      node: NodeId
      clientRect: Rect
    }
    let fromNodeId: NodeId | undefined, subject: Fqn
    // Use from params if available
    if (params) {
      subject = params.fqn
      fromNodeId = params.fromNode ?? context.view.nodes.find(n => n.modelRef === params.fqn)?.id
    }
    // Use from event if available
    else if (event.type === 'xyflow.nodeClick') {
      if (!('modelFqn' in event.node.data) || !event.node.data.modelFqn) {
        console.warn('No modelFqn in clicked node data')
        return
      }
      subject = event.node.data.modelFqn
      fromNodeId = event.node.data.id
    }
    else if (event.type === 'open.elementDetails') {
      subject = event.fqn
      fromNodeId = event.fromNode
    }
    // Use from lastClickedNode if available
    else {
      invariant(context.lastClickedNode, 'No last clicked node')
      fromNodeId = nonNullable(context.lastClickedNode).id
      const node = nonNullable(context.xynodes.find(n => n.id === fromNodeId))
      invariant('modelFqn' in node.data && !!node.data.modelFqn, 'No modelFqn in last clicked node')
      subject = node.data.modelFqn
    }

    const internalNode = fromNodeId ? context.xystore.getState().nodeLookup.get(fromNodeId) : null
    if (fromNodeId && internalNode) {
      const nodeRect = nodeToRect(internalNode)
      const zoom = context.xyflow!.getZoom()

      const clientRect = {
        ...context.xyflow!.flowToScreenPosition(nodeRect),
        width: nodeRect.width * zoom,
        height: nodeRect.height * zoom,
      }
      initiatedFrom = {
        node: fromNodeId,
        clientRect,
      }
    }

    enqueue.sendTo(
      typedSystem(system).overlaysActorRef!,
      {
        type: 'open.elementDetails' as const,
        subject,
        currentView: context.view,
        ...(initiatedFrom && { initiatedFrom }),
      },
    )
  })

export const openSourceOfFocusedOrLastClickedNode = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    const nodeId = context.focusedNode ?? context.lastClickedNode?.id
    if (!nodeId || !context.features.enableVscode) return
    const diagramNode = findDiagramNode(context, nodeId)
    if (!diagramNode) return

    if (diagramNode.deploymentRef) {
      enqueue.raise({ type: 'open.source', deployment: diagramNode.deploymentRef })
    } else if (diagramNode.modelRef) {
      enqueue.raise({ type: 'open.source', element: diagramNode.modelRef })
    }
  })

export const ensureOverlaysActorState = () =>
  machine.enqueueActions(({ enqueue, context: { features }, system }) => {
    const enableOverlays = features.enableElementDetails || features.enableRelationshipDetails ||
      features.enableRelationshipBrowser
    const hasRunning = typedSystem(system).overlaysActorRef
    if (enableOverlays && !hasRunning) {
      enqueue.spawnChild('overlaysActorLogic', { id: 'overlays', systemId: 'overlays' })
      return
    }
    if (!enableOverlays && hasRunning) {
      enqueue.sendTo(hasRunning, {
        type: 'close.all',
      })
      enqueue.stopChild('overlays')
    }
  })

export const ensureSearchActorState = () =>
  machine.enqueueActions(({ enqueue, context: { features: { enableSearch } }, system }) => {
    const hasRunning = typedSystem(system).searchActorRef
    if (enableSearch && !hasRunning) {
      enqueue.spawnChild('searchActorLogic', { id: 'search', systemId: 'search' })
      return
    }
    if (!enableSearch && hasRunning) {
      enqueue.sendTo(hasRunning, {
        type: 'close',
      })
      enqueue.stopChild('search')
    }
  })

export const onEdgeMouseEnter = () =>
  machine.enqueueActions(({ enqueue, context, event }) => {
    assertEvent(event, 'xyflow.edgeMouseEnter')
    let edge = event.edge
    enqueue.assign({
      xyedges: context.xyedges.map(e => {
        if (e.id === event.edge.id) {
          // Set hovered state (will be used in emitted event)
          edge = Base.setHovered(e, true)
          return edge
        }
        return e
      }),
    })
    enqueue.emit({
      type: 'edgeMouseEnter',
      edge,
      event: event.event,
    })
  })

export const onEdgeMouseLeave = () =>
  machine.enqueueActions(({ enqueue, context, event }) => {
    assertEvent(event, 'xyflow.edgeMouseLeave')
    let edge = event.edge
    enqueue.assign({
      xyedges: context.xyedges.map(e => {
        if (e.id === event.edge.id) {
          edge = Base.setHovered(e, false)
          return edge
        }
        return e
      }),
    })
    enqueue.emit({
      type: 'edgeMouseLeave',
      edge,
      event: event.event,
    })
  })

export const cancelFitDiagram = () => machine.cancel('fitDiagram')

export const raiseFitDiagram = (params?: { delay?: number; duration?: number }) =>
  machine.enqueueActions(({ enqueue }) => {
    enqueue.cancel('fitDiagram')
    enqueue.raise(
      {
        type: 'fitDiagram',
        ...(isNumber(params?.duration) ? { duration: params.duration } : {}),
      },
      {
        id: 'fitDiagram',
        ...(isNumber(params?.delay) ? { delay: params.delay } : {}),
      },
    )
  })

export const updateView = () =>
  machine.enqueueActions(
    ({ enqueue, event, check, context, system }) => {
      assertEvent(event, 'update.view')
      const isAnotherView = check('is another view')
      enqueue(cancelFitDiagram())
      if (isAnotherView) {
        enqueue(stopSyncLayout())
        enqueue(closeAllOverlays())
        enqueue(closeSearch())
        enqueue.assign({
          focusedNode: null,
        })
        enqueue(disableCompareWithLatest())
        const { fromNode, toNode } = findCorrespondingNode(context, event)
        if (fromNode && toNode) {
          enqueue(xyflow.alignNodeFromToAfterNavigate({
            fromNode: fromNode.id as NodeId,
            toPosition: {
              x: toNode.data.x,
              y: toNode.data.y,
            },
          }))

          enqueue(raiseFitDiagram({ delay: 80 }))
        } else {
          enqueue(
            xyflow.setViewportCenter(),
          )
          enqueue(raiseFitDiagram({ duration: 200, delay: 25 }))
        }
        enqueue(updateXYNodesEdges())
        enqueue(ensureSyncLayout())
        return
      }

      enqueue(updateXYNodesEdges())
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      if (syncLayoutActor) {
        enqueue.sendTo(syncLayoutActor, { type: 'synced' })
      }

      const nextView = event.view

      if (context.toggledFeatures.enableCompareWithLatest === true && context.view._layout !== nextView._layout) {
        if (nextView._layout === 'auto' && context.viewportOnAutoLayout) {
          enqueue(
            xyflow.setViewport({
              viewport: context.viewportOnAutoLayout,
              duration: 0,
            }),
          )
          return
        }
        // If switching to manual layout, restore previous manual layout viewport
        if (nextView._layout === 'manual' && context.viewportOnManualLayout) {
          enqueue(
            xyflow.setViewport({
              viewport: context.viewportOnManualLayout,
              duration: 0,
            }),
          )
          return
        }
      }

      let recenter = !context.viewportChangedManually

      // Check if dynamic view mode changed
      recenter = recenter || (
        nextView._type === 'dynamic' &&
        context.view._type === 'dynamic' &&
        nextView.variant !== context.view.variant
      )

      // Check if comparing layouts is enabled and layout changed
      recenter = recenter || (
        context.toggledFeatures.enableCompareWithLatest === true &&
        !!nextView._layout &&
        context.view._layout !== nextView._layout
      )

      if (recenter) {
        enqueue(
          xyflow.setViewportCenter(BBox.center(nextView.bounds)),
        )
        enqueue(raiseFitDiagram({ delay: 50 }))
      }
    },
  )
