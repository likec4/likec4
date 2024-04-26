import type { DiagramView } from '@likec4/core'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type {
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProperties,
  OnCanvasClick,
  OnChange,
  OnEdgeClick,
  OnNavigateTo,
  OnNodeClick
} from '../LikeC4Diagram.props'
import type { XYFlowInstance, XYFlowNode } from '../xyflow/types'

export interface DiagramStore {
  // Incoming props
  view: DiagramView
  readonly: boolean
  showElementLinks: boolean
  isNodeInteractive: boolean
  fitView: boolean
  fitViewPadding: number
  nodesDraggable: boolean

  // Internal state
  xyflow: XYFlowInstance | null
  xyflowInitialized: boolean
  // User moved the viewport
  viewportMoved: boolean
  hoveredNodeId: string | null
  hoveredEdgeId: string | null

  onChange: OnChange | undefined
  onNavigateTo: OnNavigateTo | undefined
  onNodeClick: OnNodeClick | undefined
  onNodeContextMenu: OnNodeClick | undefined
  onCanvasContextMenu: OnCanvasClick | undefined
  onEdgeClick: OnEdgeClick | undefined
  onEdgeContextMenu: OnEdgeClick | undefined
  onCanvasClick: OnCanvasClick | undefined
  onCanvasDblClick: OnCanvasClick | undefined
}

export type DiagramInitialState = // Required properties
  Pick<
    DiagramStore,
    | 'view'
    | 'readonly'
    | 'isNodeInteractive'
    | 'showElementLinks'
    | 'fitView'
    | 'fitViewPadding'
    | 'nodesDraggable'
    | keyof LikeC4DiagramEventHandlers
  >
// // Optional properties
// & Partial<
//   Pick<
//     DiagramStore,
//     | 'onChange'
//     | 'onNavigateTo'
//     | 'onNodeClick'
//     | 'onNodeContextMenu'
//     | 'onCanvasContextMenu'
//     | 'onEdgeClick'
//     | 'onEdgeContextMenu'
//     | 'onCanvasClick'
//     | 'onCanvasDblClick'
//   >
// >

interface DiagramActions {
  triggerOnChange: () => void
  triggerOnNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
}

export type DiagramState = DiagramStore & DiagramActions
