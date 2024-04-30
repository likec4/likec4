import type { DiagramNode, DiagramView, ElementShape, Fqn, NonEmptyArray, ThemeColor, ViewID } from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Exact, Except, RequiredKeysOf, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { Change, DiagramNodeWithNavigate, LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { MinZoom } from '../xyflow/const'
import type { XYFlowInstance } from '../xyflow/types'

export type DiagramStore = {
  // Incoming props
  view: DiagramView
  readonly: boolean
  showElementLinks: boolean
  fitViewEnabled: boolean
  fitViewPadding: number
  nodesDraggable: boolean
  nodesSelectable: boolean

  // Internal state
  xyflow: XYFlowInstance
  initialized: boolean

  // This is XYFlow id's
  lastClickedNodeId: string | null
  lastClickedEdgeId: string | null
  hoveredNodeId: string | null
  hoveredEdgeId: string | null

  // Stack of previous distinct views (unique id's)
  previousViews: DiagramView[]

  lastOnNavigate: null | {
    fromView: ViewID
    toView: ViewID
    element: DiagramNode
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

  getElement(id: Fqn): DiagramNode | null
  triggerOnChange: (changes: NonEmptyArray<Change>) => void
  triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
  fitDiagram: () => void
}

export type DiagramState = Simplify<DiagramStore & DiagramStoreActions>

const DEFAULT_PROPS: Except<DiagramStore, RequiredKeysOf<DiagramInitialState> | 'xyflow'> = {
  initialized: false,
  previousViews: [],
  viewportChanged: false,
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
              lastClickedNodeId,
              lastClickedEdgeId,
              hoveredEdgeId,
              hoveredNodeId,
              ...state
            } = get()

            if (shallowEqual(currentView, view)) {
              DEV && console.debug('store: skip updateView')
              return
            }

            DEV && console.debug('store: updateView')

            // Reset lastOnNavigate if the view is not the source or target view
            if (lastOnNavigate && lastOnNavigate.toView !== view.id && lastOnNavigate.fromView !== view.id) {
              lastOnNavigate = null
            }

            const isSameView = currentView.id === view.id

            if (isSameView) {
              // Reset clicked/hovered node/edge if the node/edge is not in the new view
              if (lastClickedNodeId || hoveredNodeId) {
                const nodeIds = new Set(view.nodes.map(({ id }) => id))
                if (lastClickedNodeId && !nodeIds.has(lastClickedNodeId)) {
                  lastClickedNodeId = null
                }
                if (hoveredNodeId && !nodeIds.has(hoveredNodeId)) {
                  hoveredNodeId = null
                }
              }

              if (lastClickedEdgeId || hoveredEdgeId) {
                const edgeIds = new Set(view.edges.map(({ id }) => id))
                if (lastClickedEdgeId && !edgeIds.has(lastClickedEdgeId)) {
                  lastClickedEdgeId = null
                }
                if (hoveredEdgeId && !edgeIds.has(hoveredEdgeId)) {
                  hoveredEdgeId = null
                }
              }
            } else {
              // Reset hovered / clicked node/edge if the view is different
              lastClickedEdgeId = null
              lastClickedNodeId = null
              hoveredEdgeId = null
              hoveredNodeId = null
            }

            // Update history stack
            if (!isSameView) {
              previousViews = [
                currentView,
                ...previousViews.filter((v) => v.id !== view.id)
              ]
            }

            set(
              {
                view,
                lastOnNavigate,
                previousViews,
                lastClickedNodeId,
                lastClickedEdgeId,
                hoveredEdgeId,
                hoveredNodeId,
                ...state
              },
              true,
              'update-view'
            )
          },

          setHoveredNode: (nodeId) => {
            set({ hoveredNodeId: nodeId }, noReplace, nodeId ? 'setHoveredNode' : 'unsetHoveredNode')
          },

          setHoveredEdge: (edgeId) => {
            set({ hoveredEdgeId: edgeId }, noReplace, edgeId ? 'setHoveredEdge' : 'unsetHoveredEdge')
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
            const { view } = get()
            set(
              {
                view: {
                  ...view,
                  nodes: view.nodes.map((node) => {
                    const shape = newShapes.get(node.id)
                    const color = newColor.get(node.id)
                    if (shape || color) {
                      return {
                        ...node,
                        shape: shape ?? node.shape,
                        color: color ?? node.color
                      }
                    }
                    return node
                  })
                }
              },
              noReplace,
              'triggerOnChange'
            )
            get().onChange?.({ changes })
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { xyflow, view } = get()
            const xynode = xyflow.getInternalNode(xynodeId)
            invariant(xynode?.data.element.navigateTo, `node is not navigable: ${xynodeId}`)
            set(
              {
                lastClickedNodeId: xynodeId,
                lastOnNavigate: {
                  fromView: view.id,
                  toView: xynode.data.element.navigateTo,
                  element: xynode.data.element,
                  positionCorrected: false
                }
              },
              false,
              'triggerOnNavigateTo'
            )
            get().onNavigateTo?.({
              element: xynode.data.element as DiagramNodeWithNavigate,
              xynode,
              event
            })
          },

          fitDiagram: () => {
            const { fitViewPadding, xyflow } = get()
            xyflow.fitView({
              includeHiddenNodes: true,
              duration: 400,
              padding: fitViewPadding,
              minZoom: MinZoom,
              maxZoom: 1
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
