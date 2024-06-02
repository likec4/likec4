import type {
  BorderStyle,
  DiagramNode,
  DiagramView,
  ElementShape,
  Fqn,
  NonEmptyArray,
  ThemeColor,
  ViewID
} from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { entries } from 'remeda'
import type { Exact, Except, RequiredKeysOf, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { Change, DiagramNodeWithNavigate, LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { MinZoom } from '../xyflow/const'
import type { XYFlowInstance, XYFlowNode } from '../xyflow/types'

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

  // This is XYFlow id's
  lastClickedNodeId: string | null
  lastClickedEdgeId: string | null
  focusedNodeId: string | null
  hoveredNodeId: string | null
  hoveredEdgeId: string | null

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
  fitDiagram: () => void
}

export type DiagramState = Simplify<DiagramStore & DiagramStoreActions>

const DEFAULT_PROPS: Except<DiagramStore, RequiredKeysOf<DiagramInitialState> | 'xyflow'> = {
  initialized: false,
  xyflowSynced: false,
  previousViews: [],
  viewportChanged: false,
  focusedNodeId: null,
  hoveredNodeId: null,
  hoveredEdgeId: null,
  lastClickedNodeId: null,
  lastClickedEdgeId: null,
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

const containsWithId = <T extends { id: string }>(arr: T[], id: string) => arr.some((x) => x.id === id)

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

          updateView: (view) => {
            let {
              xyflowSynced,
              view: currentView,
              lastOnNavigate,
              previousViews,
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId,
              hoveredEdgeId,
              hoveredNodeId,
              xyflow
            } = get()

            if (shallowEqual(currentView, view)) {
              if (!xyflowSynced) {
                set({ xyflowSynced: true }, noReplace, 'updateView: xyflow synced')
              }
              DEV && console.debug('store: skip updateView')
              return
            }

            const isSameView = currentView.id === view.id

            if (isSameView) {
              // Reset clicked/hovered node/edge if the node/edge is not in the new view
              if (lastClickedNodeId && !containsWithId(view.nodes, lastClickedNodeId)) {
                lastClickedNodeId = null
              }
              if (hoveredNodeId && !containsWithId(view.nodes, hoveredNodeId)) {
                hoveredNodeId = null
              }
              if (focusedNodeId && !containsWithId(view.nodes, focusedNodeId)) {
                focusedNodeId = null
              }
              if (lastClickedEdgeId && !containsWithId(view.edges, lastClickedEdgeId)) {
                lastClickedEdgeId = null
              }
              if (hoveredEdgeId && !containsWithId(view.edges, hoveredEdgeId)) {
                hoveredEdgeId = null
              }
              xyflowSynced = shallowEqual(currentView.nodes, view.nodes) && shallowEqual(currentView.edges, view.edges)
            } else {
              // Reset lastOnNavigate if the view is not the source or target view
              if (lastOnNavigate) {
                if (lastOnNavigate.toView !== view.id && lastOnNavigate.fromView !== view.id) {
                  lastOnNavigate = null
                }
              }

              // Reset hovered / clicked node/edge if the view is different
              lastClickedEdgeId = null
              lastClickedNodeId = null
              hoveredEdgeId = null
              hoveredNodeId = null
              focusedNodeId = null

              // Update history stack (back button not implemented yet)
              previousViews = [
                currentView,
                ...previousViews.filter((v) => v.id !== view.id && v.id !== currentView.id)
              ]
              xyflowSynced = false
            }

            set(
              {
                view,
                xyflowSynced,
                lastOnNavigate,
                previousViews,
                lastClickedNodeId,
                lastClickedEdgeId,
                focusedNodeId,
                hoveredEdgeId,
                hoveredNodeId
              },
              noReplace,
              'update-view'
            )
          },

          focusOnNode: (nodeId) => {
            if (nodeId !== get().focusedNodeId) {
              set({ focusedNodeId: nodeId }, noReplace, `focus on node: ${nodeId}`)
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
                  lastClickedEdgeId: null
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

          fitDiagram: () => {
            const { fitViewPadding, view, xyflow, focusedNodeId } = get()
            const bounds = {
              x: 0,
              y: 0,
              width: view.width,
              height: view.height
            }
            xyflow.fitBounds(bounds, {
              duration: 400,
              padding: fitViewPadding
            })
            if (!!focusedNodeId) {
              set({ focusedNodeId: null }, noReplace, 'unfocus')
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
