import type { Types } from '@likec4/diagram'
import {
  type MiniMapNodes as XYMiniMapNodes,
  MiniMap as XYMiniMap,
} from '@xyflow/react'

type TXYMiniMap = typeof XYMiniMap<Types.AnyNode>

export const MiniMap: TXYMiniMap = XYMiniMap
export type MiniMapNodes = XYMiniMapNodes<Types.AnyNode>

export {
  type Align,
  ControlButton,
  Controls,
  MiniMapNode,
  type MiniMapNodeProps,
  NodeToolbar,
  type NodeToolbarProps,
  Panel,
  Position,
  ViewportPortal,
} from '@xyflow/react'
