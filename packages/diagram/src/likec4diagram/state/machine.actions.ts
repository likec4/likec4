// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
import {
  invariant,
  nonNullable,
} from '@likec4/core'
import type {
  DiagramNode,
  Fqn,
  LayoutType,
  NodeId,
  NodeNotation as ElementNotation,
  ViewId,
} from '@likec4/core/types'
import { type Rect, nodeToRect } from '@xyflow/system'
import { hasAtLeast, isTruthy } from 'remeda'
import {
  assertEvent,
} from 'xstate'
import { Base } from '../../base'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { createLayoutConstraints } from '../useLayoutConstraints'
import { type AlignmentMode, getAligner, toNodeRect } from './aligners'
import {
  focusNodesEdges,
  mergeXYNodesEdges,
  resetEdgeControlPoints,
} from './assign'
import { createViewChange } from './createViewChange'
import { machine } from './machine.setup'
import {
  findDiagramEdge,
  findDiagramNode,
  typedSystem,
} from './utils'

export * from './machine.actions.layout'

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
    const update = mergeXYNodesEdges(context, event)

    let { lastClickedNode, focusedNode } = context
    if (lastClickedNode || focusedNode) {
      const nodeIds = new Set(update.xynodes.map(n => n.id))
      if (lastClickedNode && !nodeIds.has(lastClickedNode.id)) {
        lastClickedNode = null
      }
      if (focusedNode && !nodeIds.has(focusedNode)) {
        focusedNode = null
      }
      return {
        ...update,
        lastClickedNode,
        focusedNode,
      }
    }

    return update
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

export const emitNavigateTo = (params?: { viewId: ViewId }) =>
  machine.emit(({ context }) => ({
    type: 'navigateTo',
    viewId: params?.viewId ?? nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
  }))

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

export const notationsHighlight = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'notations.highlight')

    const { notation, kind } = event
    const targetKinds = kind ? [kind] : notation.kinds

    const shouldHighlight = (node: DiagramNode) =>
      node.notation === notation.title &&
      node.shape === notation.shape &&
      node.color === notation.color &&
      targetKinds.includes(node.kind)

    const xynodes = context.xynodes.map((n) => {
      const node = findDiagramNode(context, n.id)
      const highlighted = node && shouldHighlight(node)
      return Base.setDimmed(n, highlighted ? false : 'immediate')
    })

    const xyedges = context.xyedges.map((edge) => Base.setDimmed(edge, 'immediate'))

    return { xynodes, xyedges }
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

export const assignToggledFeatures = () =>
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

export const stopSyncLayout = () =>
  machine.enqueueActions(({ enqueue, system }) => {
    const syncLayoutActor = typedSystem(system).syncLayoutActorRef
    if (!syncLayoutActor) return
    enqueue.stopChild(syncLayoutActor)
  })

/**
 * Ensure that the sync layout actor is running or stopped based on the read-only state
 */
export const ensureSyncLayoutActor = () =>
  machine.enqueueActions(({ context, enqueue, system }) => {
    const isReadOnly = context.features.enableReadOnly || context.toggledFeatures.enableReadOnly === true
    const syncLayoutActor = typedSystem(system).syncLayoutActorRef
    // Check if the context is read-only
    if (isReadOnly && syncLayoutActor) {
      enqueue.stopChild(syncLayoutActor)
      return
    }
    if (!isReadOnly && !syncLayoutActor) {
      enqueue.spawnChild('syncManualLayoutActorLogic', {
        id: 'syncLayout',
        systemId: 'syncLayout',
        input: {
          viewId: context.view.id,
        },
        syncSnapshot: true,
      })
    }
  })

export const startEditing = (subject: 'node' | 'edge' = 'node') =>
  machine.sendTo(
    ({ system }) => typedSystem(system).syncLayoutActorRef!,
    {
      type: 'editing.start',
      subject,
    },
  )

export const sendSynced = () =>
  machine.sendTo(
    ({ system }) => typedSystem(system).syncLayoutActorRef!,
    {
      type: 'synced',
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

export const cancelEditing = () =>
  machine.sendTo(
    ({ system }) => typedSystem(system).syncLayoutActorRef!,
    {
      type: 'cancel',
    },
  )

const hasModelFqn = <D extends Types.Node>(node: D): node is D & { data: { modelFqn: Fqn } } =>
  'modelFqn' in node.data && isTruthy(node.data.modelFqn)

export const openElementDetails = (params?: { fqn: Fqn; fromNode?: NodeId | undefined }) =>
  machine.enqueueActions(({ context, event, enqueue, system }) => {
    let initiatedFrom = null as null | {
      node: NodeId
      clientRect: Rect
    }
    let fromNodeId: NodeId | undefined, subject: Fqn
    switch (true) {
      // Use from params if available
      case !!params: {
        subject = params.fqn
        fromNodeId = params.fromNode ?? context.view.nodes.find(n => n.modelRef === params.fqn)?.id
        break
      }
      case event.type === 'xyflow.nodeClick': {
        if (!hasModelFqn(event.node)) {
          console.warn('No modelFqn in clicked node data')
          return
        }
        subject = event.node.data.modelFqn
        fromNodeId = event.node.data.id
        break
      }
      case event.type === 'open.elementDetails': {
        subject = event.fqn
        fromNodeId = event.fromNode
        break
      }
      default: {
        if (!context.lastClickedNode) {
          console.warn('No last clicked node')
          return
        }
        fromNodeId = context.lastClickedNode.id
        const node = context.xynodes.find(n => n.id === fromNodeId)
        if (!node || !hasModelFqn(node)) {
          console.warn('No modelFqn in last clicked node')
          return
        }
        subject = node.data.modelFqn
        break
      }
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
        subject: subject,
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

/**
 * Ensure that the overlays actor is running or stopped based on the current feature flags
 */
export const ensureOverlaysActor = () =>
  machine.enqueueActions(({ enqueue, check, system }) => {
    const enableOverlays = check('enabled: Overlays')
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

/**
 * Ensure that the search actor is running or stopped based on the current feature flags
 */
export const ensureSearchActor = () =>
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

export const reraise = () => machine.raise(({ event }) => event, { delay: 10 })

export const startHotKeyActor = () => machine.spawnChild('hotkeyActorLogic', { id: 'hotkey' })
export const stopHotKeyActor = () => machine.stopChild('hotkey')
