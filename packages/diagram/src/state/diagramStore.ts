import type { DiagramNode, DiagramView, Fqn, ViewID } from '@likec4/core'
import { invariant, nonexhaustive, StepEdgeId } from '@likec4/core'
import { getViewportForBounds, type XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { deepEqual, shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { entries, isEmpty, reduce } from 'remeda'
import type { Exact, Except, RequiredKeysOf, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { Changes, DiagramNodeWithNavigate, LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { MinZoom } from '../xyflow/const'
import type { XYStoreApi } from '../xyflow/hooks'
import type { XYFlowEdge, XYFlowInstance, XYFlowNode } from '../xyflow/types'
import { bezierControlPoints, isSamePoint } from '../xyflow/utils'

export type DiagramStore = {
  // Incoming props
  view: DiagramView
  readonly: boolean
  showElementLinks: boolean
  fitViewEnabled: boolean
  fitViewPadding: number
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  experimentalEdgeEditing: boolean
  // Diagram Container, see DiagramContainer.tsx
  getContainer: () => HTMLDivElement | null

  // Internal state
  viewSyncDebounceTimeout: number | null

  xyflow: XYFlowInstance
  xystore: XYStoreApi
  initialized: boolean
  xyflowSynced: boolean

  // If Dynamic View
  activeDynamicViewStep: number | null

  // This is XYFlow id's
  lastClickedNodeId: string | null
  lastClickedEdgeId: string | null
  focusedNodeId: string | null
  hoveredNodeId: string | null
  hoveredEdgeId: string | null

  // id's of nodes / edges that
  dimmed: ReadonlySet<string>

  // Stack of previous distinct views (unique id's)
  previousViews: DiagramView[]

  lastOnNavigate: null | {
    fromView: ViewID
    toView: ViewID
    element: DiagramNode
    // Position of the element in the source view
    elementScreenPosition: XYPosition
    // If node from the target view is placed on the same position as the node from the source view
    positionCorrected: boolean
  }

  // User changed the viewport by dragging or zooming
  viewportChanged: boolean
} & Required<LikeC4DiagramEventHandlers>

const StringSet = Set<string>

export type DiagramInitialState = // Required properties
  & Pick<
    DiagramStore,
    | 'view'
    | 'readonly'
    | 'showElementLinks'
    | 'fitViewEnabled'
    | 'fitViewPadding'
    | 'zoomable'
    | 'pannable'
    | 'nodesDraggable'
    | 'nodesSelectable'
    | 'experimentalEdgeEditing'
  >
  // Optional properties
  // & Partial<
  //   Pick<
  //     DiagramStore,
  //     'colorScheme'
  //   >
  // >
  & LikeC4DiagramEventHandlers

interface DiagramStoreActions {
  isDynamicView: () => boolean

  updateView: (view: DiagramView) => void

  focusOnNode: (nodeId: string) => void

  setHoveredNode: (nodeId: string | null) => void
  setHoveredEdge: (edgeId: string | null) => void

  setLastClickedNode: (nodeId: string | null) => void
  setLastClickedEdge: (edgeId: string | null) => void

  resetLastClicked: () => void

  getElement(id: Fqn): DiagramNode | null
  triggerChangeElementStyle: (change: Changes.ChangeElementStyle) => void

  cancelSaveManualLayout: () => void
  triggerSaveManualLayout: () => void
  triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
  fitDiagram: (duration?: number) => void

  nextDynamicStep: (increment?: number) => void
  stopDynamicView: () => void
}

export type DiagramState = Simplify<DiagramStore & DiagramStoreActions>

const DEFAULT_PROPS: Except<DiagramStore, RequiredKeysOf<DiagramInitialState> | 'xystore' | 'xyflow' | 'getContainer'> =
  {
    viewSyncDebounceTimeout: null,
    initialized: false,
    xyflowSynced: false,
    previousViews: [],
    viewportChanged: false,
    activeDynamicViewStep: null,
    focusedNodeId: null,
    hoveredNodeId: null,
    hoveredEdgeId: null,
    lastClickedNodeId: null,
    lastClickedEdgeId: null,
    dimmed: new StringSet(),
    lastOnNavigate: null,
    onChange: null,
    onNavigateTo: null,
    onNodeClick: null,
    onNodeContextMenu: null,
    onCanvasContextMenu: null,
    onEdgeClick: null,
    onEdgeContextMenu: null,
    onCanvasClick: null,
    onCanvasDblClick: null
  }

export type CreateDiagramStore = DiagramInitialState & Pick<DiagramStore, 'xystore' | 'xyflow' | 'getContainer'>

const noReplace = false

let storeDevId = 1

const EmptyStringSet: ReadonlySet<string> = new StringSet()

export function createDiagramStore<T extends Exact<CreateDiagramStore, T>>(props: T) {
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
          ...(props as CreateDiagramStore),

          isDynamicView: () => {
            return get().view?.__ === 'dynamic'
          },

          updateView: (nextView) => {
            let {
              viewSyncDebounceTimeout,
              xyflow,
              dimmed,
              xyflowSynced,
              view: current,
              lastOnNavigate,
              previousViews,
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId,
              activeDynamicViewStep,
              hoveredEdgeId,
              hoveredNodeId
            } = get()

            if (shallowEqual(current, nextView)) {
              DEV && console.debug('store: skip updateView')
              return
            }

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
              xyflowSynced = deepEqual([current.nodes, current.edges], [nextView.nodes, nextView.edges])
              if (dimmed.size > 0) {
                let nextDimmed = new StringSet([...dimmed].filter(id => nodeIds.has(id) || edgeIds.has(id)))
                if (nextDimmed.size !== dimmed.size) {
                  dimmed = nextDimmed
                }
              }
            } else {
              // Reset lastOnNavigate if the view is not the source or target view
              if (lastOnNavigate) {
                if (lastOnNavigate.toView !== nextView.id && lastOnNavigate.fromView !== nextView.id) {
                  lastOnNavigate = null
                }
              }

              if (!lastOnNavigate) {
                const zoom = xyflow.getZoom()
                xyflow.setCenter(nextView.width / 2, nextView.height / 2, { zoom })
              }

              // Reset hovered / clicked node/edge if the view is different
              lastClickedEdgeId = null
              lastClickedNodeId = null
              hoveredEdgeId = null
              hoveredNodeId = null
              focusedNodeId = null
              activeDynamicViewStep = null
              dimmed = EmptyStringSet

              // Update history stack (back button not implemented yet)
              previousViews = [
                current,
                ...previousViews.filter((v) => v.id !== nextView.id && v.id !== current.id)
              ]
              xyflowSynced = false
            }

            set(
              {
                viewSyncDebounceTimeout,
                view: nextView,
                activeDynamicViewStep,
                xyflowSynced,
                lastOnNavigate,
                previousViews,
                lastClickedNodeId,
                lastClickedEdgeId,
                focusedNodeId,
                hoveredEdgeId,
                hoveredNodeId,
                dimmed
              },
              noReplace,
              isSameView ? 'update-view [same]' : 'update-view [another]'
            )
          },

          focusOnNode: (nodeId) => {
            const { focusedNodeId, view } = get()
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
            }
          },

          triggerSaveManualLayout: () => {
            let { viewSyncDebounceTimeout: debounced, onChange } = get()
            if (!onChange) {
              DEV && console.debug('ignore triggerSaveManualLayout, as no onChange handler is set')
              return
            }
            if (debounced) {
              clearTimeout(debounced)
            }
            debounced = setTimeout(() => {
              const { xyflow, onChange, xystore } = get()
              const { nodeLookup } = xystore.getState()
              set({ viewSyncDebounceTimeout: null })

              const movedNodes = new StringSet()
              const nodes = reduce([...nodeLookup.values()], (acc, node) => {
                const dimensions = getNodeDimensions(node)
                if (!isSamePoint(node.internals.positionAbsolute, node.data.element.position)) {
                  movedNodes.add(node.id)
                }
                acc[node.data.fqn] = {
                  x: node.internals.positionAbsolute.x,
                  y: node.internals.positionAbsolute.y,
                  width: dimensions.width,
                  height: dimensions.height
                }
                return acc
              }, {} as Changes.SaveManualLayout['nodes'])
              const edges = reduce(xyflow.getEdges(), (acc, { source, target, data }) => {
                let controlPoints = data.controlPoints
                // If edge control points are not set, but the source or target node was moved
                if (!controlPoints && (movedNodes.has(source) || movedNodes.has(target))) {
                  controlPoints = bezierControlPoints(data.edge)
                }
                if (controlPoints) {
                  acc[data.edge.id] = {
                    controlPoints
                  }
                }
                return acc
              }, {} as Changes.SaveManualLayout['edges'])
              if (movedNodes.size === 0 && isEmpty(edges)) {
                DEV && console.debug('ignore triggerSaveManualLayout, as no changes detected')
                return
              }

              const change: Changes.SaveManualLayout = {
                op: 'save-manual-layout',
                nodes,
                edges
              }

              if (DEV) {
                console.debug('triggerSaveManualLayout', change)
              }

              onChange?.({ change })
            }, 2000)
            set(
              {
                viewSyncDebounceTimeout: debounced
              },
              noReplace,
              'debounce sync state'
            )
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { xyflow, view } = get()
            const xynode = xyflow.getInternalNode(xynodeId)
            invariant(!!xynode, `node not found: ${xynodeId}`)
            const element = xynode.data.element as DiagramNodeWithNavigate
            invariant(element.navigateTo, `node is not navigable: ${xynodeId}`)
            set(
              {
                lastClickedNodeId: xynodeId,
                lastOnNavigate: {
                  fromView: view.id,
                  toView: element.navigateTo,
                  element: element,
                  elementScreenPosition: xyflow.flowToScreenPosition({
                    x: xynode.internals.positionAbsolute.x, // + dimensions.width / 2,
                    y: xynode.internals.positionAbsolute.y // + dimensions.height / 2
                  }),
                  positionCorrected: false
                }
              },
              noReplace,
              'triggerOnNavigateTo'
            )
            get().onNavigateTo?.(
              element.navigateTo,
              event,
              element,
              xynode.internals.userNode
            )
          },

          fitDiagram: (duration = 500) => {
            const { fitViewPadding, view, focusedNodeId, activeDynamicViewStep, xystore } = get()
            const { width, height, panZoom, transform } = xystore.getState()

            const bounds = {
              x: 0,
              y: 0,
              width: view.width,
              height: view.height
            }
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
            const { view, activeDynamicViewStep, xyflow, xystore, fitViewPadding } = get()
            invariant(view.__ === 'dynamic', 'view is not dynamic')
            const nextStep = (activeDynamicViewStep ?? 0) + increment
            if (nextStep <= 0 || nextStep > view.edges.length) {
              return
            }
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
              'nextDynamicStep'
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
          }
        }),
        {
          name: `DiagramStore ${storeDevId++} - ${props.view.id}`,
          enabled: DEV
        }
      )
    ),
    shallow
  )
}
