import type { DiagramNode, DiagramView, ElementShape, Fqn, NonEmptyArray, ThemeColor, ViewID } from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
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

  setHoveredNode: (nodeId: string | null) => void
  setHoveredEdge: (edgeId: string | null) => void

  setLastClickedNode: (nodeId: string | null) => void
  setLastClickedEdge: (edgeId: string | null) => void

  getElement(id: Fqn): DiagramNode | null
  triggerOnChange: (changes: NonEmptyArray<Change>) => void
  triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
  fitDiagram: (centerNode?: XYFlowNode) => void
}

export type DiagramState = Simplify<DiagramStore & DiagramStoreActions>

const DEFAULT_PROPS: Except<DiagramStore, RequiredKeysOf<DiagramInitialState> | 'xyflow'> = {
  initialized: false,
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
              view: currentView,
              lastOnNavigate,
              previousViews,
              focusedNodeId,
              lastClickedNodeId,
              lastClickedEdgeId,
              hoveredEdgeId,
              hoveredNodeId
            } = get()

            if (shallowEqual(currentView, view)) {
              DEV && console.debug('store: skip updateView')
              return
            }

            // Reset lastOnNavigate if the view is not the source or target view
            if (lastOnNavigate && lastOnNavigate.toView !== view.id && lastOnNavigate.fromView !== view.id) {
              lastOnNavigate = null
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
            } else {
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
            }

            set(
              {
                view,
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

          getElement: (fqn) => {
            const { view } = get()
            return view.nodes.find(({ id }) => id === fqn) ?? null
          },

          triggerOnChange: (changes: NonEmptyArray<Change>) => {
            const newShapes = new Map<Fqn, ElementShape>()
            const newColor = new Map<Fqn, ThemeColor>()
            for (const change of changes) {
              if (change.op === 'change-shape') {
                for (const target of change.targets) {
                  newShapes.set(target, change.shape)
                }
                continue
              }
              if (change.op === 'change-color') {
                for (const target of change.targets) {
                  newColor.set(target, change.color)
                }
                continue
              }
              nonexhaustive(change)
            }
            // TODO: Update positions/sizes
            // const { view, updateView } = get()
            // let hasChanges = false
            // const nextNodes = view.nodes.map((node) => {
            //   const shape = newShapes.get(node.id)
            //   if (shape && shape !== node.shape) {
            //     hasChanges = true
            //     node = {
            //       ...node,
            //       shape
            //     }
            //   }
            //   const color = newColor.get(node.id)
            //   if (color && color !== node.color) {
            //     hasChanges = true
            //     node = {
            //       ...node,
            //       color
            //     }
            //   }
            //   return node
            // })
            // if (hasChanges) {
            //   updateView({
            //     ...view,
            //     nodes: nextNodes
            //   })
            // }
            get().xyflow.setNodes(nodes =>
              nodes.map(node => {
                let { data } = node
                const shape = newShapes.get(data.fqn)
                if (shape && shape !== data.element.shape) {
                  node = {
                    ...node,
                    data: {
                      ...data,
                      element: {
                        ...data.element,
                        shape
                      }
                    }
                  }
                  data = node.data
                }
                const color = newColor.get(data.fqn)
                if (color && color !== data.element.color) {
                  node = {
                    ...node,
                    data: {
                      ...data,
                      element: {
                        ...data.element,
                        color
                      }
                    }
                  }
                }
                return node
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

          fitDiagram: (centerNode) => {
            const { fitViewPadding, xyflow, focusedNodeId } = get()
            xyflow.fitView({
              includeHiddenNodes: true,
              duration: (centerNode && focusedNodeId) ? 300 : 400,
              padding: centerNode ? 0 : fitViewPadding,
              minZoom: MinZoom,
              maxZoom: 1,
              ...(centerNode && { nodes: [centerNode] })
            })
            if (centerNode && focusedNodeId !== centerNode.id) {
              set({ focusedNodeId: centerNode.id }, noReplace, 'focus node')
            }
            if (!centerNode && !!focusedNodeId) {
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
