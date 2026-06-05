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

export const xyflow = {
  ControlButton: XYControlButton,
  MiniMap: XYMiniMap<Types.AnyNode>,
  MiniMapNode: XYMiniMapNode,
  NodeToolbar: XYNodeToolbar,
  Panel: XYPanel,
  Position: XYPosition,
  ViewportPortal: XYViewportPortal,
} as const
