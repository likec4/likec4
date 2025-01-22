import type {
  ComputedNode,
  DiagramNode,
  DiagramView,
  EdgeId,
  ElementNotation,
  Fqn,
  NodeId,
  ViewChange,
  ViewId,
  XYPoint,
} from '@likec4/core'
import {
  type StepEdgeId,
  getBBoxCenter,
  getParallelStepsPrefix,
  invariant,
  isStepEdgeId,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import {
  type OnEdgesChange,
  type OnNodesChange,
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import { boxToRect, getBoundsOfRects, getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { deepEqual as eq, shallowEqual } from 'fast-equals'
import { type MouseEvent as ReactMouseEvent } from 'react'
import { entries, first, hasAtLeast, isNullish, map, prop, reduce } from 'remeda'
import type { ConditionalKeys, Except, RequiredKeysOf, RequireExactlyOne, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { XYStoreApi } from '../hooks/useXYFlow'
import type {
  DiagramNodeWithNavigate,
  ElementIconRenderer,
  LikeC4DiagramEventHandlers,
  WhereOperator,
} from '../LikeC4Diagram.props'
import { type Vector, vector, VectorImpl } from '../utils/vector'
import { MinZoom } from '../xyflow/const'
import type { DiagramFlowTypes } from '../xyflow/types'
import { bezierControlPoints, isInside, isSamePoint, toDomPrecision } from '../xyflow/utils'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'
import { type AlignmentMode, align } from './diagramStore.layout'

type RequiredOrNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]> | null
}

export type DiagramInitialState = {
  view: DiagramView
  readonly: boolean
  // If LikeC4Model provided
  hasLikeC4Model: boolean
  controls: boolean
  showNavigationButtons: boolean
  showNotations: boolean
  fitViewEnabled: boolean
  fitViewPadding: number
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  experimentalEdgeEditing: boolean
  enableFocusMode: boolean
  enableElementDetails: boolean
  enableRelationshipBrowser: boolean
  enableRelationshipDetails: boolean
  enableSearch: boolean
  renderIcon: ElementIconRenderer | null
  whereFilter: WhereOperator<string, string> | null
  // If Dynamic View
  enableDynamicViewWalkthrough: boolean

  xyflow: DiagramFlowTypes.XYFlowInstance
  xystore: XYStoreApi

  // Diagram Container, for Mantine Portal
  getContainer: () => HTMLDivElement | null
} & RequiredOrNull<LikeC4DiagramEventHandlers>

type NodeKind = ComputedNode['kind']

const StringSet = Set<string>

export type DiagramState = Simplify<
  DiagramInitialState & {
    readonly storeDevId: string

    // Internal state
    xynodes: DiagramFlowTypes.Node[]
    xyedges: DiagramFlowTypes.Edge[]
    viewSyncDebounceTimeout: number | null
    viewportChanged: boolean

    initialized: boolean

    activeOverlay:
      | null
      | RequireExactlyOne<{
        elementDetails: Fqn
        relationshipsOf: Fqn
        edgeDetails: EdgeId
      }>

    // readonly=false and onChange is not null
    isEditable: () => boolean

    // If Dynamic View
    isDynamicView: boolean
    activeWalkthrough: null | {
      stepId: StepEdgeId
      hasPrevious: boolean
      hasNext: boolean
      parallelPrefix: string | null
    }

    // This is XYFlow id's
    lastClickedNodeId: string | null
    lastClickedEdgeId: string | null
    focusedNodeId: string | null
    hoveredEdgeId: string | null

    // id's of nodes / edges that
    dimmed: ReadonlySet<string>

    lastOnNavigate: null | {
      fromView: ViewId
      toView: ViewId
      fromNode: NodeId | null
    }
    navigationHistory: Array<{
      viewId: ViewId
      nodeId: NodeId | null
    }>
    navigationHistoryIndex: number

    // Actions
    updateView: (view: DiagramView) => void

    /**
     * A function to set the focus on a specific node given its identifier.
     * It can also be used to remove focus if the input is `false`.
     */
    focusOnNode: (nodeId: string | false) => void

    setHoveredEdge: (edgeId: string | null) => void

    setLastClickedNode: (nodeId: string | null) => void
    setLastClickedEdge: (edgeId: string | null) => void

    resetFocusAndLastClicked: () => void

    getElement(id: Fqn): DiagramNode | null
    getSelectedNodeIds(): string[]
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
    activateWalkthrough: (step: EdgeId | DiagramFlowTypes.Edge) => void
    stopWalkthrough: () => void

    openOverlay: (overlay: NonNullable<DiagramState['activeOverlay']>) => void
    closeOverlay: () => void

    onInit: (xyflow: DiagramFlowTypes.XYFlowInstance) => void
    onNodesChange: OnNodesChange<DiagramFlowTypes.Node>
    onEdgesChange: OnEdgesChange<DiagramFlowTypes.Edge>

    highlightByElementNotation: (notation: ElementNotation, onlyOfKind?: NodeKind) => void

    resetEdgeControlPoints: () => void
    align: (mode: AlignmentMode) => void

    onOpenSourceView: () => void
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
  activeOverlay: null,
  activeWalkthrough: null,
  focusedNodeId: null,
  hoveredEdgeId: null,
  lastClickedNodeId: null,
  lastClickedEdgeId: null,
  dimmed: new StringSet(),
  lastOnNavigate: null,
}

const noReplace = false

let StoreDevId = 1

const EmptyStringSet: ReadonlySet<string> = new StringSet()

export function createDiagramStore(props: DiagramInitialState) {
  const storeDevId = 'DiagramStore' + String(StoreDevId++).padStart(2, '0')
  const {
    xynodes,
    xyedges,
  } = diagramViewToXYFlowData(props.view, {
    where: props.whereFilter,
    draggable: props.nodesDraggable,
    selectable: props.nodesSelectable,
  })
  return createWithEqualityFn<
    DiagramState,
    [
      ['zustand/subscribeWithSelector', never],
      ['zustand/devtools', never],
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
            nodeId: null as Fqn | null,
          }],
          navigationHistoryIndex: 0,

          onNodesChange: (changes) => {
            set({
              xynodes: applyNodeChanges(changes, get().xynodes),
            })
          },
          onEdgesChange: (changes) => {
            set({
              xyedges: applyEdgeChanges(changes, get().xyedges),
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
              activeWalkthrough,
              activeOverlay,
              nodesDraggable,
              nodesSelectable,
              hoveredEdgeId,
              xyedges,
              xynodes,
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
              if (focusedNodeId && !nodeIds.has(focusedNodeId)) {
                focusedNodeId = null
                dimmed = EmptyStringSet
              }
              if (lastClickedEdgeId && !edgeIds.has(lastClickedEdgeId)) {
                lastClickedEdgeId = null
              }
              if (hoveredEdgeId && !edgeIds.has(hoveredEdgeId)) {
                hoveredEdgeId = null
              }
              if (activeWalkthrough && !edgeIds.has(activeWalkthrough.stepId)) {
                activeWalkthrough = null
                dimmed = EmptyStringSet
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
                    nodeId: lastOnNavigate?.fromNode || null,
                  },
                ]
                navigationHistoryIndex = navigationHistory.length - 1
              } else {
                // We are navigating to the same view as in the history
                if (stepCurrent.nodeId) {
                  lastOnNavigate ??= {
                    fromView: current.id,
                    toView: nextView.id,
                    fromNode: stepCurrent.nodeId,
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
                    y: xynodeFrom.internals.positionAbsolute.y, // + dimensions.height / 2
                  }),
                  toPos = xyflow.flowToScreenPosition({
                    x: elTo.position[0], // + elFrom.width / 2,
                    y: elTo.position[1], // + elFrom.height / 2
                  }),
                  diff = {
                    x: toDomPrecision(fromPos.x - toPos.x),
                    y: toDomPrecision(fromPos.y - toPos.y),
                  }
                xystore.getState().panBy(diff)
                lastOnNavigate = null
              }

              // Reset hovered / clicked node/edge if the view is different
              lastClickedEdgeId = null
              lastClickedNodeId = null
              hoveredEdgeId = null
              focusedNodeId = null
              activeWalkthrough = null
              activeOverlay = null
              dimmed = EmptyStringSet
            }

            const update = diagramViewToXYFlowData(nextView, {
              where: whereFilter,
              draggable: nodesDraggable,
              selectable: nodesSelectable,
            })

            update.xynodes = update.xynodes.map((update) => {
              const existing = xynodes.find(n => n.id === update.id)
              if (
                existing
                && existing.type === update.type
                && eq(existing.parentId ?? null, update.parentId ?? null)
              ) {
                if (
                  existing.width === update.width
                  && existing.height === update.height
                  && eq(existing.hidden ?? false, update.hidden ?? false)
                  && eq(existing.position, update.position)
                  && eq(existing.data, update.data)
                ) {
                  return existing
                }
                return {
                  ...existing,
                  ...update,
                } as DiagramFlowTypes.Node
              }
              return update
            })
            // Merge with existing edges, but only if the view is the same
            // and the edges have no layout drift
            if (isSameView && !nextView.hasLayoutDrift) {
              update.xyedges = update.xyedges.map((update): DiagramFlowTypes.Edge => {
                const existing = xyedges.find(n => n.id === update.id)
                if (existing) {
                  if (
                    eq(existing.hidden ?? false, update.hidden ?? false)
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
                      ...update.data,
                    },
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
                activeWalkthrough,
                activeOverlay,
                lastOnNavigate,
                lastClickedNodeId,
                lastClickedEdgeId,
                focusedNodeId,
                hoveredEdgeId,
                navigationHistory,
                navigationHistoryIndex,
                dimmed,
                xynodes: !isSameView || !shallowEqual(update.xynodes, xynodes) ? update.xynodes : xynodes,
                xyedges: !isSameView || !shallowEqual(update.xyedges, xyedges) ? update.xyedges : xyedges,
              },
              noReplace,
              isSameView ? 'update-view [same]' : 'update-view [another]',
            )
          },

          focusOnNode: (nodeId) => {
            const { focusedNodeId, view, enableFocusMode } = get()
            invariant(enableFocusMode, 'focus mode is not enabled')
            if (nodeId === false) {
              set(
                {
                  activeWalkthrough: null,
                  activeOverlay: null,
                  focusedNodeId: null,
                  dimmed: EmptyStringSet,
                },
                noReplace,
                `unfocus`,
              )
              return
            }
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
                  activeWalkthrough: null,
                  activeOverlay: null,
                  focusedNodeId: nodeId,
                  dimmed,
                },
                noReplace,
                `focus on node: ${nodeId}`,
              )
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

          resetFocusAndLastClicked: () => {
            set(
              {
                activeWalkthrough: null,
                activeOverlay: null,
                focusedNodeId: null,
                lastClickedNodeId: null,
                lastClickedEdgeId: null,
                dimmed: EmptyStringSet,
              },
              noReplace,
              'resetLastClicked',
            )
            get().xystore.getState().resetSelectedElements()
          },

          getElement: (fqn) => {
            const { view } = get()
            return view.nodes.find(({ id }) => id === fqn) ?? null
          },

          isEditable: () => {
            const { readonly, onChange } = get()
            return !readonly && !!onChange
          },

          getSelectedNodeIds: () => {
            return get().xynodes.filter(x => x.selected).map(x => x.id)
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
                        shape: value,
                      }
                    }
                    break
                  case 'color':
                    if (value !== element.color) {
                      element = {
                        ...element,
                        color: value,
                      }
                    }
                    break
                  case 'opacity':
                    if (value !== element.style?.opacity) {
                      element = {
                        ...element,
                        style: {
                          ...element.style,
                          opacity: value,
                        },
                      }
                    }
                    break
                  case 'border':
                    if (value !== element.style?.border) {
                      element = {
                        ...element,
                        style: {
                          ...element.style,
                          border: value,
                        },
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
                nodes,
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
              height: 1,
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
                height: Math.ceil(dimensions.height),
              }
              bounds = getBoundsOfRects(bounds, rect)
              return acc
            }, {} as ViewChange.SaveManualLayout['layout']['nodes'])

            const edges = reduce(xyflow.getEdges(), (acc, { source, target, data }) => {
              let controlPoints = data.controlPoints ?? []
              const sourceOrTargetMoved = movedNodes.has(source) || movedNodes.has(target)
              // If edge control points are not set, but the source or target node was moved
              if (controlPoints.length === 0 && sourceOrTargetMoved) {
                controlPoints = bezierControlPoints(data.edge)
              }
              if (data.edge.points.length === 0 && controlPoints.length === 0) {
                return acc
              }
              const _updated: ViewChange.SaveManualLayout['layout']['edges'][string] = acc[data.edge.id] = {
                points: data.edge.points,
              }
              if (data.label?.bbox) {
                _updated.labelBBox = data.label.bbox
              }
              if (data.edge.labelBBox) {
                _updated.labelBBox ??= data.edge.labelBBox
              }
              if (hasAtLeast(controlPoints, 1)) {
                _updated.controlPoints = controlPoints
              }
              if (!sourceOrTargetMoved && data.edge.dotpos) {
                _updated.dotpos = data.edge.dotpos
              }
              const allX = [
                ...data.edge.points.map(p => p[0]),
                ...controlPoints.map(p => p.x),
                ...(_updated.labelBBox ? [_updated.labelBBox.x, _updated.labelBBox.x + _updated.labelBBox.width] : []),
              ]
              const allY = [
                ...data.edge.points.map(p => p[1]),
                ...controlPoints.map(p => p.y),
                ...(_updated.labelBBox ? [_updated.labelBBox.y, _updated.labelBBox.y + _updated.labelBBox.height] : []),
              ]
              const rect = boxToRect({
                x: Math.floor(Math.min(...allX)),
                y: Math.floor(Math.min(...allY)),
                x2: Math.ceil(Math.max(...allX)),
                y2: Math.ceil(Math.max(...allY)),
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
                ...bounds,
              },
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
                    bounds,
                  },
                },
                noReplace,
                'update view bounds',
              )
            }
            onChange?.({ change })
          },
          scheduleSaveManualLayout: () => {
            clearTimeout(get().viewSyncDebounceTimeout ?? undefined)
            set(
              {
                viewSyncDebounceTimeout: setTimeout(() => {
                  get().triggerSaveManualLayout()
                }, 1000) as any as number, // explicit typecast to number to suppress TS error in astro build
              },
              noReplace,
              'debounce sync state',
            )
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { view, xynodes, onNavigateTo, cancelSaveManualLayout } = get()
            if (!onNavigateTo) {
              return
            }
            const xynode = xynodes.find(({ id }) => id === xynodeId)
            invariant(xynode, `xynode not found: ${xynodeId}`)
            const element = xynode.data.element
            invariant(element?.navigateTo, `node is not navigable: ${xynodeId}`)
            cancelSaveManualLayout()
            set(
              {
                lastClickedNodeId: xynodeId,
                lastOnNavigate: {
                  fromView: view.id,
                  toView: element.navigateTo,
                  fromNode: element.id,
                },
              },
              noReplace,
              'triggerOnNavigateTo',
            )
            onNavigateTo(
              element.navigateTo,
              event,
              element as DiagramNodeWithNavigate,
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
                      fromNode: nodeId as Fqn,
                    }
                    : null,
                },
                noReplace,
                'goBack',
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
                      fromNode: stepForward.nodeId as Fqn,
                    }
                    : null,
                },
                noReplace,
                'goForward',
              )
              onNavigateTo(stepForward.viewId)
            }
          },

          onOpenSourceView: () => {
            const { view, onOpenSource } = get()
            onOpenSource?.({
              view: view.id,
            })
          },

          openOverlay: (overlay) => {
            if (eq(overlay, get().activeOverlay)) {
              return
            }
            if ('elementDetails' in overlay) {
              const diagramNode = get().view.nodes.find(({ id }) => id === overlay.elementDetails)
              if (!diagramNode || !diagramNode.modelRef) {
                get().closeOverlay()
                return
              }
            }

            set(
              {
                activeWalkthrough: null,
                activeOverlay: overlay,
              },
              noReplace,
              'openOverlay',
            )
          },
          closeOverlay: () => {
            if (get().activeOverlay !== null) {
              set(
                {
                  activeOverlay: null,
                },
                noReplace,
                'closeOverlay',
              )
            }
          },

          fitDiagram: (duration = 500) => {
            const { fitViewPadding, view, xystore } = get()
            const { width, height, panZoom, transform } = xystore.getState()

            const bounds = view.bounds
            const maxZoom = Math.max(1, transform[2])
            const viewport = getViewportForBounds(bounds, width, height, MinZoom, maxZoom, fitViewPadding)
            panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
          },

          nextDynamicStep: (increment = 1) => {
            const { activeWalkthrough, xyedges, activateWalkthrough } = get()
            const stepId = activeWalkthrough?.stepId
            let nextStep
            if (stepId) {
              const currentIndex = xyedges.findIndex(({ id }) => id === stepId)
              const nextIndex = currentIndex + increment
              nextStep = xyedges[nextIndex]
            } else {
              nextStep = first(xyedges)
            }
            if (nextStep) {
              activateWalkthrough(nextStep.data.edge.id)
              return
            }
          },

          activateWalkthrough: (step: EdgeId | DiagramFlowTypes.Edge) => {
            const stepId = typeof step === 'string' ? step : step.data.edge.id
            invariant(isStepEdgeId(stepId), `stepId ${stepId} is not a step edge id`)
            let {
              isDynamicView,
              xyflow,
              xyedges,
              xystore,
              fitViewPadding,
              activeWalkthrough,
            } = get()
            invariant(isDynamicView, 'view is not dynamic')
            const edge = typeof step === 'string' ? xyedges.find(({ id }) => id === stepId) : step
            invariant(edge, `edge not found: ${stepId}`)
            const currentIndex = xyedges.findIndex(({ id }) => id === stepId)
            activeWalkthrough = {
              stepId,
              hasPrevious: currentIndex > 0,
              hasNext: currentIndex < xyedges.length - 1,
              parallelPrefix: getParallelStepsPrefix(stepId),
            }

            const dimmed = new StringSet(
              xyedges
                .filter(({ id }) =>
                  id !== stepId
                  && !(activeWalkthrough.parallelPrefix && id.startsWith(activeWalkthrough.parallelPrefix))
                )
                .map(({ id }) => id),
            )
            const selected = [] as DiagramFlowTypes.Node[]
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
              nodes: selected,
            })
            set(
              {
                focusedNodeId: null,
                activeWalkthrough,
                dimmed,
              },
              noReplace,
              'activateWalkthrough',
            )
          },

          stopWalkthrough: () => {
            if (get().activeWalkthrough !== null) {
              set(
                {
                  activeWalkthrough: null,
                  focusedNodeId: null,
                  dimmed: EmptyStringSet,
                },
                noReplace,
                'stopWalkthrough',
              )
              get().fitDiagram()
            }
          },

          onInit: (instance) => {
            const { xyflow, initialized, fitViewEnabled, fitDiagram } = get()
            if (!initialized || xyflow !== instance) {
              if (fitViewEnabled) {
                fitDiagram(0)
              }
              set(
                {
                  xyflow: instance,
                  initialized: true,
                },
                noReplace,
                'onInit',
              )
            }
          },

          highlightByElementNotation: (notation: ElementNotation, onlyOfKind?: NodeKind) => {
            const { xynodes, xyedges } = get()
            const dimmed = new StringSet(map(xyedges, prop('id')))
            xynodes.forEach(({ id, data }) => {
              const node = data.element
              if (
                node.shape !== notation.shape || node.color !== notation.color || !notation.kinds.includes(node.kind)
                || (onlyOfKind && node.kind !== onlyOfKind)
              ) {
                dimmed.add(id)
              }
            })
            set({ dimmed }, noReplace, 'highlightByElementNotation')
          },

          resetEdgeControlPoints: () => {
            const { xyflow, scheduleSaveManualLayout, xynodes, xyedges } = get()

            xyedges.forEach(edge => {
              xyflow.updateEdgeData(edge.id, {
                controlPoints: getControlPointForEdge(edge),
              })
            })

            scheduleSaveManualLayout()

            function getNodeCenter(node: DiagramFlowTypes.Node, nodes: DiagramFlowTypes.Node[]) {
              const dimensions = vector({ x: node.width || 0, y: node.height || 0 })
              let position = vector(node.position)
                .add(dimensions.mul(0.5))

              let currentNode = node
              do {
                const parent = currentNode.parentId && nodes.find(x => x.id == currentNode.parentId)

                if (!parent) {
                  break
                }

                currentNode = parent
                position = position.add(parent.position)
              } while (true)

              return position
            }

            function getControlPointForEdge(edge: DiagramFlowTypes.Edge): XYPoint[] {
              const source = xynodes.find(x => x.id == edge.source)
              const target = xynodes.find(x => x.id == edge.target)
              if (!source || !target) {
                return []
              }

              const sourceCenter = getNodeCenter(source, xynodes)
              const targetCenter = getNodeCenter(target, xynodes)

              if (!sourceCenter || !targetCenter) {
                return []
              }

              // Edge is a loop
              if (source == target) {
                const loopSize = 80
                const centerOfTopBoundary = new VectorImpl(0, source.height || 0)
                  .mul(-0.5)
                  .add(sourceCenter)

                return [
                  centerOfTopBoundary.add(new VectorImpl(-loopSize / 2.5, -loopSize)),
                  centerOfTopBoundary.add(new VectorImpl(loopSize / 2.5, -loopSize)),
                ]
              }

              const sourceToTargetVector = targetCenter.sub(sourceCenter)
              const sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector)
              const targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.mul(-1))

              return [sourceBorderPoint.add(targetBorderPoint.sub(sourceBorderPoint).mul(0.3))]
            }

            function getBorderPointOnVector(node: DiagramFlowTypes.Node, nodeCenter: Vector, v: Vector) {
              const xScale = (node.width || 0) / 2 / v.x
              const yScale = (node.height || 0) / 2 / v.y

              const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

              return vector(v).mul(scale).add(nodeCenter)
            }
          },
          align: align(get),
        } satisfies DiagramState),
        {
          name: `${storeDevId} - ${props.view.id}`,
          enabled: DEV,
        },
      ),
    ),
    shallow,
  )
}

export type DiagramZustandStore = ReturnType<typeof createDiagramStore>
export type DiagramStoreApi = Readonly<Pick<DiagramZustandStore, 'getState' | 'setState' | 'subscribe'>>
