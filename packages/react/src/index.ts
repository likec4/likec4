import {
  ControlButton as XYControlButton,
  MiniMap as XYMiniMap,
  MiniMapNode as XYMiniMapNode,
  NodeToolbar as XYNodeToolbar,
  Panel as XYPanel,
  Position as XYPosition,
  ViewportPortal as XYViewportPortal,
} from '@xyflow/react'

import type { Types } from '@likec4/diagram'

export * from '@likec4/diagram'
export * from '@likec4/diagram/custom'

export namespace xyflow {
  export const ControlButton = XYControlButton

  export const MiniMap = XYMiniMap<Types.AnyNode>
  export const MiniMapNode = XYMiniMapNode
  export const NodeToolbar = XYNodeToolbar
  export const Panel = XYPanel
  export const Position = XYPosition
  export const ViewportPortal = XYViewportPortal
}
