import type { DiagramNode, DiagramView, Fqn, NodeId, ViewChange, ViewID } from '@likec4/core'
import { getBBoxCenter, invariant, nonexhaustive, nonNullable, StepEdgeId } from '@likec4/core'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
  type OnEdgesChange,
  type OnNodesChange
} from '@xyflow/react'
import { boxToRect, getBoundsOfRects, getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { deepEqual as eq, shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { entries, hasAtLeast, isNullish, reduce } from 'remeda'
import type { ConditionalKeys, Exact, Except, RequiredKeysOf, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { XYStoreApi } from '../hooks/useXYFlow'
import type {
  DiagramNodeWithNavigate,
  ElementIconRenderer,
  LikeC4DiagramEventHandlers,
  WhereOperator
} from '../LikeC4Diagram.props'
import { MinZoom } from '../xyflow/const'
import type { XYFlowEdge, XYFlowInstance, XYFlowNode } from '../xyflow/types'
import { bezierControlPoints, isInside, isSamePoint, toDomPrecision } from '../xyflow/utils'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

type RequiredOrNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]> | null
}

export type DiagramInitialState = {
  view: DiagramView
  readonly: boolean
  showElementLinks: boolean
  showNavigationButtons: boolean
  fitViewEnabled: boolean
  fitViewPadding: number
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  experimentalEdgeEditing: boolean
  enableFocusMode: boolean
  renderIcon: ElementIconRenderer | null
  whereFilter: WhereOperator<string, string> | null
  // If Dynamic View
  enableDynamicViewWalkthrough: boolean

  xyflow: XYFlowInstance
  xystore: XYStoreApi

  // Diagram Container, for Mantine Portal
  getContainer: () => HTMLDivElement | null
} & RequiredOrNull<LikeC4DiagramEventHandlers>

const StringSet = Set<string>

export type DiagramState = Simplify<
  DiagramInitialState & {
    readonly storeDevId: string

    // Internal state
    xynodes: XYFlowNode[]
    xyedges: XYFlowEdge[]
    viewSyncDebounceTimeout: number | null
    viewportChanged: boolean

    initialized: boolean

    // If Dynamic View
    isDynamicView: boolean
    activeDynamicViewStep: number | null

    // This is XYFlow id's
    lastClickedNodeId: string | null
    lastClickedEdgeId: string | null
    focusedNodeId: string | null
    hoveredNodeId: string | null
    hoveredEdgeId: string | null

    // id's of nodes / edges that
    dimmed: ReadonlySet<string>

    lastOnNavigate: null | {
      fromView: ViewID
      toView: ViewID
      fromNode: NodeId
    }
    navigationHistory: Array<{
      viewId: ViewID
      nodeId: NodeId | null
    }>
    navigationHistoryIndex: number

    // Actions
    updateView: (view: DiagramView) => void

    focusOnNode: (nodeId: string) => void

    setHoveredNode: (nodeId: string | null) => void
    setHoveredEdge: (edgeId: string | null) => void

    setLastClickedNode: (nodeId: string | null) => void
    setLastClickedEdge: (edgeId: string | null) => void

    resetLastClicked: () => void

    getElement(id: Fqn): DiagramNode | null
    triggerChangeElementStyle: (change: ViewChange.ChangeElementStyle) => void

    /**
     * @returns true if there was pending save layout
     */
    cancelSaveManualLayout: () => boolean
    scheduleSaveManualLayout: () => void
    triggerSaveManualLayout: () => void

    triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
    fitDiagram: (duration?: number) => void

    goBack: () => void
    goForward: () => void

    nextDynamicStep: (increment?: number) => void
    activateDynamicStep: (step: number) => void
    stopDynamicView: () => void

    onInit: (xyflow: XYFlowInstance) => void
    onNodesChange: OnNodesChange<XYFlowNode>
    onEdgesChange: OnEdgesChange<XYFlowEdge>
  }
>

const DEFAULT_PROPS: Except<
  DiagramState,
  'storeDevId' | 'navigationHistory' | RequiredKeysOf<DiagramInitialState> | ConditionalKeys<DiagramState, Function>
> = {
  xyedges: [],
  xynodes: [],
  isDynamicView: false,
  viewSyncDebounceTimeout: null,
  initialized: false,
  navigationHistoryIndex: 0,
  viewportChanged: false,
  activeDynamicViewStep: null,
  focusedNodeId: null,
  hoveredNodeId: null,
  hoveredEdgeId: null,
  lastClickedNodeId: null,
  lastClickedEdgeId: null,
  dimmed: new StringSet(),
  lastOnNavigate: null
}

const noReplace = false

let StoreDevId = 1

const EmptyStringSet: ReadonlySet<string> = new StringSet()

export function createDiagramStore<T extends Exact<DiagramInitialState, T>>(props: T) {
  const storeDevId = 'DiagramStore' + String(StoreDevId++).padStart(2, '0')
  const {
    xynodes,
    xyedges
  } = diagramViewToXYFlowData(props.view, {
    where: props.whereFilter,
    draggable: props.nodesDraggable,
    selectable: props.nodesSelectable
  })
  return createWithEqualityFn<
    DiagramState,
    [
      ['zustand/subscribeWithSelector', never],
      ['zustand/devtools', never]
    ]
  >(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...DEFAULT_PROPS,
          ...(props as DiagramInitialState),
          storeDevId,
          isDynamicView: props.view.__ === 'dynamic',
          xynodes,
          xyedges,
          navigationHistory: [{
            viewId: props.view.id,
            nodeId: null as Fqn | null
          }],
          navigationHistoryIndex: 0,

          onNodesChange: (changes) => {
            set({
              xynodes: applyNodeChanges(changes, get().xynodes)
            })
          },
          onEdgesChange: (changes) => {
            set({
              xyedges: applyEdgeChanges(changes, get().xyedges)
            })
          },

          updateView: (nextView) => {
            let {
              viewSyncDebounceTimeout,
              xyflow,
              xystore,
              dimmed,
              whereFilter,
              view: current,
              lastOnNavigate,
              navigationHistory,
              navigationHistoryIndex,
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId,
              activeDynamicViewStep,
              nodesDraggable,
              nodesSelectable,
              hoveredEdgeId,
              hoveredNodeId,
              xyedges,
              xynodes
            } = get()

            if (viewSyncDebounceTimeout !== null) {
              clearTimeout(viewSyncDebounceTimeout)
              viewSyncDebounceTimeout = null
            }

            const isSameView = current.id === nextView.id

            if (isSameView) {
              const nodeIds = new StringSet(nextView.nodes.map((n) => n.id))
              const edgeIds = new StringSet(nextView.edges.map((e) => e.id))
              // Reset clicked/hovered node/edge if the node/edge is not in the new view
              if (lastClickedNodeId && !nodeIds.has(lastClickedNodeId)) {
                lastClickedNodeId = null
              }
              if (hoveredNodeId && !nodeIds.has(hoveredNodeId)) {
                hoveredNodeId = null
              }
              if (focusedNodeId && !nodeIds.has(focusedNodeId)) {
                focusedNodeId = null
              }
              if (lastClickedEdgeId && !edgeIds.has(lastClickedEdgeId)) {
                lastClickedEdgeId = null
              }
              if (hoveredEdgeId && !edgeIds.has(hoveredEdgeId)) {
                hoveredEdgeId = null
              }
              if (activeDynamicViewStep && !edgeIds.has(StepEdgeId(activeDynamicViewStep))) {
                activeDynamicViewStep = null
              }
              if (dimmed.size > 0) {
                let nextDimmed = new StringSet([...dimmed].filter(id => nodeIds.has(id) || edgeIds.has(id)))
                if (nextDimmed.size !== dimmed.size) {
                  dimmed = nextDimmed
                }
              }
            } else {
              // Reset lastOnNavigate if the view is not the source or target view
              const stepCurrent = nonNullable(navigationHistory[navigationHistoryIndex])
              if (stepCurrent.viewId !== nextView.id) {
                navigationHistory = [
                  ...navigationHistory.slice(0, navigationHistoryIndex + 1),
                  {
                    viewId: nextView.id,
                    nodeId: lastOnNavigate?.fromNode || null
                  }
                ]
                navigationHistoryIndex = navigationHistory.length - 1
              } else {
                // We are navigating to the same view as in the history
                if (stepCurrent.nodeId) {
                  lastOnNavigate ??= {
                    fromView: current.id,
                    toView: nextView.id,
                    fromNode: stepCurrent.nodeId
                  }
                }
              }

              if (lastOnNavigate && lastOnNavigate.toView !== nextView.id) {
                lastOnNavigate = null
              }

              const elTo = lastOnNavigate && nextView.nodes.find(n => n.id === lastOnNavigate?.fromNode)
              const xynodeFrom = elTo && xyflow.getInternalNode(elTo.id)

              if (!lastOnNavigate || isNullish(elTo) || isNullish(xynodeFrom)) {
                const zoom = xyflow.getZoom()
                const { x, y } = getBBoxCenter(nextView.bounds)
                xyflow.setCenter(x, y, { zoom })
                lastOnNavigate = null
              }

              if (lastOnNavigate && !!elTo && !!xynodeFrom) {
                const fromPos = xyflow.flowToScreenPosition({
                    x: xynodeFrom.internals.positionAbsolute.x, // + dimensions.width / 2,
                    y: xynodeFrom.internals.positionAbsolute.y // + dimensions.height / 2
                  }),
                  toPos = xyflow.flowToScreenPosition({
                    x: elTo.position[0], // + elFrom.width / 2,
                    y: elTo.position[1] // + elFrom.height / 2
                  }),
                  diff = {
                    x: toDomPrecision(fromPos.x - toPos.x),
                    y: toDomPrecision(fromPos.y - toPos.y)
                  }
                xystore.getState().panBy(diff)
                lastOnNavigate = null
              }

              // Reset hovered / clicked node/edge if the view is different
              lastClickedEdgeId = null
              lastClickedNodeId = null
              hoveredEdgeId = null
              hoveredNodeId = null
              focusedNodeId = null
              activeDynamicViewStep = null
              dimmed = EmptyStringSet
            }

            const update = diagramViewToXYFlowData(nextView, {
              where: whereFilter,
              draggable: nodesDraggable,
              selectable: nodesSelectable
            })

            update.xynodes = update.xynodes.map(update => {
              const existing = xynodes.find(n => n.id === update.id)
              if (
                existing
                && existing.type === update.type
                && eq(existing.parentId ?? null, update.parentId ?? null)
              ) {
                if (
                  existing.hidden === update.hidden
                  && existing.width === update.width
                  && existing.height === update.height
                  && eq(existing.position, update.position)
                  && eq(existing.data.element, update.data.element)
                ) {
                  return existing
                }
                return {
                  ...existing,
                  ...update
                }
              }
              return update
            })
            // Merge with existing edges, but only if the view is the same
            // and the edges have no layout drift
            if (isSameView && !nextView.hasLayoutDrift) {
              update.xyedges = update.xyedges.map((update): XYFlowEdge => {
                const existing = xyedges.find(n => n.id === update.id)
                if (existing) {
                  if (
                    existing.hidden === update.hidden
                    && eq(existing.data.label, update.data.label)
                    && eq(existing.data.controlPoints, update.data.controlPoints)
                    && eq(existing.data.edge, update.data.edge)
                  ) {
                    return existing
                  }
                  return {
                    ...existing,
                    ...update,
                    data: {
                      ...existing.data,
                      ...update.data
                    }
                  }
                }
                return update
              })
            }

            set(
              {
                isDynamicView: nextView.__ === 'dynamic',
                viewSyncDebounceTimeout,
                view: nextView,
                activeDynamicViewStep,
                lastOnNavigate,
                lastClickedNodeId,
                lastClickedEdgeId,
                focusedNodeId,
                hoveredEdgeId,
                hoveredNodeId,
                navigationHistory,
                navigationHistoryIndex,
                dimmed,
                xynodes: !isSameView || !shallowEqual(update.xynodes, xynodes) ? update.xynodes : xynodes,
                xyedges: !isSameView || !shallowEqual(update.xyedges, xyedges) ? update.xyedges : xyedges
              },
              noReplace,
              isSameView ? 'update-view [same]' : 'update-view [another]'
            )
          },

          focusOnNode: (nodeId) => {
            const { focusedNodeId, view, enableFocusMode } = get()
            invariant(enableFocusMode, 'focus mode is not enabled')
            if (nodeId !== focusedNodeId) {
              const notDimmed = new StringSet([nodeId])
              const dimmed = new StringSet()
              for (const edge of view.edges) {
                if (edge.source === nodeId || edge.target === nodeId) {
                  notDimmed.add(edge.source)
                  notDimmed.add(edge.target)
                } else {
                  dimmed.add(edge.id)
                }
              }
              for (const node of view.nodes) {
                if (notDimmed.has(node.id)) {
                  continue
                }
                dimmed.add(node.id)
              }
              set(
                {
                  activeDynamicViewStep: null,
                  focusedNodeId: nodeId,
                  dimmed
                },
                noReplace,
                `focus on node: ${nodeId}`
              )
            }
          },

          setHoveredNode: (nodeId) => {
            if (nodeId !== get().hoveredNodeId) {
              set({ hoveredNodeId: nodeId })
            }
          },

          setHoveredEdge: (edgeId) => {
            if (edgeId !== get().hoveredEdgeId) {
              set({ hoveredEdgeId: edgeId })
            }
          },

          setLastClickedNode: (nodeId) => {
            if (nodeId !== get().lastClickedNodeId) {
              set({ lastClickedNodeId: nodeId })
            }
          },

          setLastClickedEdge: (edgeId) => {
            if (edgeId !== get().lastClickedEdgeId) {
              set({ lastClickedEdgeId: edgeId })
            }
          },

          resetLastClicked: () => {
            let {
              activeDynamicViewStep,
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId
            } = get()
            if (activeDynamicViewStep || focusedNodeId || lastClickedNodeId || lastClickedEdgeId) {
              set(
                {
                  activeDynamicViewStep: null,
                  focusedNodeId: null,
                  lastClickedNodeId: null,
                  lastClickedEdgeId: null,
                  dimmed: EmptyStringSet
                },
                noReplace,
                'resetLastClicked'
              )
            }
          },

          getElement: (fqn) => {
            const { view } = get()
            return view.nodes.find(({ id }) => id === fqn) ?? null
          },

          triggerChangeElementStyle: (change) => {
            if (DEV) {
              console.debug('triggerChangeElementStyle', change)
            }
            const { view, updateView, onChange } = get()

            // Style changes we already apply to the view
            let hasChanges = false
            const nodes = view.nodes.map(origin => {
              if (!change.targets.includes(origin.id)) {
                return origin
              }
              let element = origin
              for (const [key, value] of entries(change.style)) {
                switch (key) {
                  case 'shape':
                    if (value !== element.shape) {
                      element = {
                        ...element,
                        shape: value
                      }
                    }
                    break
                  case 'color':
                    if (value !== element.color) {
                      element = {
                        ...element,
                        color: value
                      }
                    }
                    break
                  case 'opacity':
                    if (value !== element.style?.opacity) {
                      element = {
                        ...element,
                        style: {
                          ...element.style,
                          opacity: value
                        }
                      }
                    }
                    break
                  case 'border':
                    if (value !== element.style?.border) {
                      element = {
                        ...element,
                        style: {
                          ...element.style,
                          border: value
                        }
                      }
                    }
                    break
                  default:
                    nonexhaustive(key)
                }
              }
              if (element !== origin) {
                hasChanges = true
                return element
              }
              return origin
            })
            if (hasChanges) {
              updateView({
                ...view,
                nodes
              })
            }
            // Trigger change event, even if there are no changes with local state
            // but we maybe out of sync with the server
            onChange?.({ change })
          },

          cancelSaveManualLayout: () => {
            let { viewSyncDebounceTimeout } = get()
            if (viewSyncDebounceTimeout !== null) {
              clearTimeout(viewSyncDebounceTimeout)
              set({ viewSyncDebounceTimeout: null })
              return true
            }
            return false
          },

          triggerSaveManualLayout: () => {
            const { xyflow, view, onChange, xystore, viewSyncDebounceTimeout } = get()
            if (viewSyncDebounceTimeout !== null) {
              clearTimeout(viewSyncDebounceTimeout)
              set({ viewSyncDebounceTimeout: null })
            }
            const { nodeLookup } = xystore.getState()
            const movedNodes = new StringSet()
            let bounds = {
              x: 0,
              y: 0,
              width: 1,
              height: 1
            }

            const nodes = reduce([...nodeLookup.values()], (acc, node) => {
              const dimensions = getNodeDimensions(node)
              if (!isSamePoint(node.internals.positionAbsolute, node.data.element.position)) {
                movedNodes.add(node.id)
              }
              const rect = acc[node.data.fqn] = {
                isCompound: node.data.element.children.length > 0,
                x: Math.floor(node.internals.positionAbsolute.x),
                y: Math.floor(node.internals.positionAbsolute.y),
                width: Math.ceil(dimensions.width),
                height: Math.ceil(dimensions.height)
              }
              bounds = getBoundsOfRects(bounds, rect)
              return acc
            }, {} as ViewChange.SaveManualLayout['layout']['nodes'])

            const edges = reduce(xyflow.getEdges(), (acc, { source, target, data }) => {
              let controlPoints = data.controlPoints
              const sourceOrTargetMoved = movedNodes.has(source) || movedNodes.has(target)
              // If edge control points are not set, but the source or target node was moved
              if ((!controlPoints || controlPoints.length === 0) && sourceOrTargetMoved) {
                controlPoints = bezierControlPoints(data.edge)
              }
              if (data.edge.points.length === 0 && (!controlPoints || controlPoints.length === 0)) {
                return acc
              }
              const _updated: ViewChange.SaveManualLayout['layout']['edges'][string] = acc[data.edge.id] = {
                points: data.edge.points
              }
              if (data.label?.bbox) {
                _updated.labelBBox = data.label?.bbox
              }
              if (data.edge.labelBBox) {
                _updated.labelBBox ??= data.edge.labelBBox
              }
              if (controlPoints && hasAtLeast(controlPoints, 1)) {
                _updated.controlPoints = controlPoints
              }
              if (!sourceOrTargetMoved && data.edge.dotpos) {
                _updated.dotpos = data.edge.dotpos
              }
              const allX = [
                ...data.edge.points.map(p => p[0]),
                ...(controlPoints ?? []).map(p => p.x),
                ...(_updated.labelBBox ? [_updated.labelBBox.x, _updated.labelBBox.x + _updated.labelBBox.width] : [])
              ]
              const allY = [
                ...data.edge.points.map(p => p[1]),
                ...(controlPoints ?? []).map(p => p.y),
                ...(_updated.labelBBox ? [_updated.labelBBox.y, _updated.labelBBox.y + _updated.labelBBox.height] : [])
              ]
              const rect = boxToRect({
                x: Math.floor(Math.min(...allX)),
                y: Math.floor(Math.min(...allY)),
                x2: Math.ceil(Math.max(...allX)),
                y2: Math.ceil(Math.max(...allY))
              })
              bounds = getBoundsOfRects(bounds, rect)
              return acc
            }, {} as ViewChange.SaveManualLayout['layout']['edges'])

            const change: ViewChange.SaveManualLayout = {
              op: 'save-manual-layout',
              layout: {
                hash: view.hash,
                autoLayout: view.autoLayout,
                nodes,
                edges,
                ...bounds
              }
            }

            if (DEV) {
              console.debug('triggerSaveManualLayout', change)
            }

            // If new view bounds are outside of the diagram bounds, update the view bounds
            // and update edges, as
            if (!isInside(bounds, view.bounds)) {
              set(
                {
                  view: {
                    ...view,
                    bounds
                  }
                },
                noReplace,
                'update view bounds'
              )
            }
            onChange?.({ change })
          },
          scheduleSaveManualLayout: () => {
            let { viewSyncDebounceTimeout } = get()
            if (viewSyncDebounceTimeout) {
              clearTimeout(viewSyncDebounceTimeout)
            }
            set(
              {
                viewSyncDebounceTimeout: setTimeout(() => {
                  get().triggerSaveManualLayout()
                }, 1000) as any as number // explicit typecast to number to suppress TS error in astro build
              },
              noReplace,
              'debounce sync state'
            )
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { view, xynodes, onNavigateTo, cancelSaveManualLayout } = get()
            if (!onNavigateTo) {
              return
            }
            const xynode = xynodes.find(({ id }) => id === xynodeId)
            invariant(xynode, `xynode not found: ${xynodeId}`)
            const element = view.nodes.find(({ id }) => id === xynodeId)
            invariant(element?.navigateTo, `node is not navigable: ${xynodeId}`)
            cancelSaveManualLayout()
            set(
              {
                lastClickedNodeId: xynodeId,
                lastOnNavigate: {
                  fromView: view.id,
                  toView: element.navigateTo,
                  fromNode: element.id
                }
              },
              noReplace,
              'triggerOnNavigateTo'
            )
            onNavigateTo(
              element.navigateTo,
              event,
              element as DiagramNodeWithNavigate,
              xynode
            )
          },

          goBack: () => {
            const { navigationHistory, navigationHistoryIndex, onNavigateTo } = get()
            const { viewId, nodeId } = nonNullable(navigationHistory[navigationHistoryIndex])
            const stepBack = (navigationHistoryIndex > 0 && navigationHistory[navigationHistoryIndex - 1]) || null
            if (stepBack && onNavigateTo) {
              set(
                {
                  lastClickedEdgeId: null,
                  lastClickedNodeId: null,
                  navigationHistoryIndex: navigationHistoryIndex - 1,
                  lastOnNavigate: nodeId
                    ? {
                      fromView: viewId,
                      toView: stepBack.viewId,
                      fromNode: nodeId as Fqn
                    }
                    : null
                },
                noReplace,
                'goBack'
              )
              onNavigateTo(stepBack.viewId)
            }
          },
          goForward: () => {
            const { navigationHistory, navigationHistoryIndex, onNavigateTo } = get()
            const { viewId } = nonNullable(navigationHistory[navigationHistoryIndex])
            const stepForward = navigationHistoryIndex < navigationHistory.length - 1
              ? navigationHistory[navigationHistoryIndex + 1]
              : null
            if (stepForward && onNavigateTo) {
              set(
                {
                  lastClickedEdgeId: null,
                  lastClickedNodeId: null,
                  navigationHistoryIndex: navigationHistoryIndex + 1,
                  lastOnNavigate: stepForward.nodeId
                    ? {
                      fromView: viewId,
                      toView: stepForward.viewId,
                      fromNode: stepForward.nodeId as Fqn
                    }
                    : null
                },
                noReplace,
                'goForward'
              )
              onNavigateTo(stepForward.viewId)
            }
          },

          fitDiagram: (duration = 500) => {
            const { fitViewPadding, view, focusedNodeId, activeDynamicViewStep, xystore } = get()
            const { width, height, panZoom, transform } = xystore.getState()

            const bounds = view.bounds
            const maxZoom = Math.max(1, transform[2])
            const viewport = getViewportForBounds(bounds, width, height, MinZoom, maxZoom, fitViewPadding)
            panZoom?.setViewport(viewport, { duration })
            if ((focusedNodeId ?? activeDynamicViewStep) !== null) {
              set(
                {
                  activeDynamicViewStep: null,
                  focusedNodeId: null,
                  dimmed: EmptyStringSet
                },
                noReplace,
                'unfocus'
              )
            }
          },

          nextDynamicStep: (increment = 1) => {
            const { activeDynamicViewStep, activateDynamicStep } = get()
            const nextStep = (activeDynamicViewStep ?? 0) + increment
            if (nextStep <= 0) {
              return
            }
            if (nextStep !== activeDynamicViewStep) {
              activateDynamicStep(nextStep)
            }
          },

          activateDynamicStep: (nextStep: number) => {
            const { isDynamicView, xyflow, xystore, fitViewPadding } = get()
            invariant(isDynamicView, 'view is not dynamic')
            const edgeId = StepEdgeId(nextStep)
            const dimmed = new StringSet()
            let edge: XYFlowEdge | null = null
            for (const e of xyflow.getEdges()) {
              if (e.id === edgeId) {
                edge = e
                continue
              }
              dimmed.add(e.id)
            }
            invariant(!!edge, `edge not found: ${edgeId}`)
            const selected = [] as XYFlowNode[]
            for (const n of xyflow.getNodes()) {
              if (n.id === edge.source || n.id === edge.target) {
                selected.push(n)
                continue
              }
              dimmed.add(n.id)
            }
            const { fitView, transform } = xystore.getState()
            fitView({
              duration: 400,
              includeHiddenNodes: true,
              maxZoom: Math.max(1, transform[2]),
              minZoom: MinZoom,
              padding: Math.max(fitViewPadding, 0.2),
              nodes: selected
            })
            set(
              {
                focusedNodeId: null,
                activeDynamicViewStep: nextStep,
                dimmed
              },
              noReplace,
              'activateDynamicStep'
            )
          },

          stopDynamicView: () => {
            if (get().activeDynamicViewStep !== null) {
              set(
                {
                  activeDynamicViewStep: null,
                  focusedNodeId: null,
                  dimmed: EmptyStringSet
                },
                noReplace,
                'stopDynamicView'
              )
              get().fitDiagram()
            }
          },

          onInit: (instance) => {
            const { xyflow, initialized } = get()
            if (!initialized || xyflow !== instance) {
              set(
                {
                  xyflow: instance,
                  initialized: true
                },
                noReplace,
                'onInit'
              )
            }
          }
        }),
        {
          name: `${storeDevId} - ${props.view.id}`,
          enabled: DEV
        }
      )
    ),
    shallow
  )
}

export type DiagramZustandStore = ReturnType<typeof createDiagramStore>
export type DiagramStoreApi = Readonly<Pick<DiagramZustandStore, 'getState' | 'setState' | 'subscribe'>>
