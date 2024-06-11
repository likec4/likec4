import type {
  BorderStyle,
  DiagramEdge,
  DiagramNode,
  DiagramView,
  ElementShape,
  Fqn,
  NonEmptyArray,
  ThemeColor,
  ViewID
} from '@likec4/core'
import { invariant, nonexhaustive, StepEdgeId } from '@likec4/core'
import { getViewportForBounds, type XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { deepEqual, shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { entries, filter, map, prop } from 'remeda'
import type { Exact, Except, RequiredKeysOf, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { Change, DiagramNodeWithNavigate, LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { MinZoom } from '../xyflow/const'
import type { XYStoreApi } from '../xyflow/hooks'
import type { XYFlowInstance } from '../xyflow/types'

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

  // Internal state
  xyflow: XYFlowInstance
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
    elementCenterScreenPosition: XYPosition
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
  triggerOnChange: (changes: NonEmptyArray<Change>) => void
  triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
  fitDiagram: (xyStore: XYStoreApi) => void

  nextDynamicStep: (increment?: number) => void
  stopDynamicView: () => void
}

export type DiagramState = Simplify<DiagramStore & DiagramStoreActions>

const DEFAULT_PROPS: Except<DiagramStore, RequiredKeysOf<DiagramInitialState> | 'xyflow'> = {
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

type CreateDiagramStore = DiagramInitialState & Pick<DiagramStore, 'xyflow'>

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
              if (!xyflowSynced) {
                set({ xyflowSynced: true }, noReplace, 'updateView: xyflow synced')
              }
              DEV && console.debug('store: skip updateView')
              return
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
              xyflowSynced = deepEqual(current.nodes, nextView.nodes) && deepEqual(current.edges, nextView.edges)
              if (!xyflowSynced) {
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
              'update-view'
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
              set({ hoveredNodeId: nodeId }, noReplace, nodeId ? 'setHoveredNode' : 'unsetHoveredNode')
            }
          },

          setHoveredEdge: (edgeId) => {
            if (edgeId !== get().hoveredEdgeId) {
              set({ hoveredEdgeId: edgeId }, noReplace, edgeId ? 'setHoveredEdge' : 'unsetHoveredEdge')
            }
          },

          setLastClickedNode: (nodeId) => {
            if (nodeId !== get().lastClickedNodeId) {
              set({ lastClickedNodeId: nodeId }, noReplace, nodeId ? 'setLastClickedNode' : 'unsetLastClickedNode')
            }
          },

          setLastClickedEdge: (edgeId) => {
            if (edgeId !== get().lastClickedEdgeId) {
              set({ lastClickedEdgeId: edgeId }, noReplace, edgeId ? 'setLastClickedEdge' : 'unsetLastClickedEdge')
            }
          },

          resetLastClicked: () => {
            let {
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId
            } = get()
            if (focusedNodeId || lastClickedNodeId || lastClickedEdgeId) {
              set(
                {
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

          triggerOnChange: (changes: NonEmptyArray<Change>) => {
            if (DEV) {
              console.debug('triggerOnChange', changes)
            }
            const newShapes = new Map<Fqn, ElementShape>()
            const newColor = new Map<Fqn, ThemeColor>()
            const newOpacity = new Map<Fqn, number>()
            const newBorder = new Map<Fqn, BorderStyle>()
            for (const change of changes) {
              if (change.op !== 'change-element-style') {
                nonexhaustive(change.op)
              }
              for (const target of change.targets) {
                for (const [key, value] of entries.strict(change.style)) {
                  switch (key) {
                    case 'shape':
                      newShapes.set(target, value)
                      break
                    case 'color':
                      newColor.set(target, value)
                      break
                    case 'opacity':
                      newOpacity.set(target, value)
                      break
                    case 'border':
                      newBorder.set(target, value)
                      break
                    default:
                      nonexhaustive(key)
                  }
                }
              }
            }

            get().xyflow.setNodes(nodes =>
              nodes.map(node => {
                let element = node.data.element
                const shape = newShapes.get(element.id)
                if (shape && shape !== element.shape) {
                  element = {
                    ...element,
                    shape
                  }
                }
                const color = newColor.get(element.id)
                if (color && color !== element.color) {
                  element = {
                    ...element,
                    color
                  }
                }

                const opacity = newOpacity.get(element.id)
                if (!!opacity && opacity !== element.style?.opacity) {
                  element = {
                    ...element,
                    style: {
                      ...element.style,
                      opacity
                    }
                  }
                }

                const border = newBorder.get(element.id)
                if (border && border !== element.style?.border) {
                  element = {
                    ...element,
                    style: {
                      ...element.style,
                      border
                    }
                  }
                }

                if (element === node.data.element) {
                  return node
                }
                return {
                  ...node,
                  data: {
                    ...node.data,
                    element
                  }
                }
              })
            )
            get().onChange?.({ changes })
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { xyflow, view } = get()
            const xynode = xyflow.getInternalNode(xynodeId)
            const element = xynode?.data.element as DiagramNodeWithNavigate
            invariant(!!xynode && element?.navigateTo, `node is not navigable: ${xynodeId}`)
            const dimensions = getNodeDimensions(xynode)
            set(
              {
                lastClickedNodeId: xynodeId,
                lastOnNavigate: {
                  fromView: view.id,
                  toView: element.navigateTo,
                  element: element,
                  elementCenterScreenPosition: xyflow.flowToScreenPosition({
                    x: xynode.internals.positionAbsolute.x + dimensions.width / 2,
                    y: xynode.internals.positionAbsolute.y + dimensions.height / 2
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

          fitDiagram: (xyStore) => {
            const { width, height, panZoom } = xyStore.getState()
            const { fitViewPadding, view, focusedNodeId } = get()
            const bounds = {
              x: 0,
              y: 0,
              width: view.width,
              height: view.height
            }
            const viewport = getViewportForBounds(bounds, width, height, MinZoom, 1, fitViewPadding)
            panZoom?.setViewport(viewport, { duration: 400 })
            if (!!focusedNodeId) {
              set(
                {
                  focusedNodeId: null,
                  dimmed: EmptyStringSet
                },
                noReplace,
                'unfocus'
              )
            }
          },

          nextDynamicStep: (increment = 1) => {
            const { view, activeDynamicViewStep, xyflow, fitViewPadding } = get()
            invariant(view.__ === 'dynamic', 'view is not dynamic')
            const nextStep = (activeDynamicViewStep ?? 0) + increment
            const edgeId = StepEdgeId(nextStep)
            const dimmed = new StringSet()
            let edge: DiagramEdge | null = null
            for (const e of view.edges) {
              if (e.id === edgeId) {
                edge = e
                continue
              }
              dimmed.add(e.id)
            }
            invariant(!!edge, `edge not found: ${edgeId}`)
            for (const n of view.nodes) {
              if (n.id === edge.source || n.id === edge.target) {
                continue
              }
              dimmed.add(n.id)
            }
            set({
              focusedNodeId: null,
              activeDynamicViewStep: nextStep,
              dimmed
            })
            xyflow.fitView({
              duration: 400,
              maxZoom: 1,
              minZoom: MinZoom,
              padding: fitViewPadding,
              nodes: [{ id: edge.source }, { id: edge.target }]
            })
          },

          stopDynamicView: () => {
            const { xyflow, fitViewPadding } = get()
            set({
              activeDynamicViewStep: null,
              dimmed: EmptyStringSet
            })
            xyflow.fitView({
              duration: 400,
              maxZoom: 1,
              minZoom: MinZoom,
              padding: fitViewPadding
            })
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
