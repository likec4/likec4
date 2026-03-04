// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export * from './builtins'
export * from './customNodes'
export * from './hooks'
export * from './primitives'

export type {
  BaseEdge,
  BaseEdgeData,
  BaseEdgeProps,
  BaseEdgePropsWithData,
  BaseNode,
  BaseNodeData,
  BaseNodeProps,
  BaseNodePropsWithData,
} from '../base/types'

export type {
  DiagramNodeWithNavigate,
  ElementIconRenderer,
  ElementIconRendererProps,
  LikeC4ColorScheme,
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProperties,
  NodeRenderers,
  OnCanvasClick,
  OnEdgeClick,
  OnNavigateTo,
  OnNodeClick,
  OpenSourceParams,
  PaddingUnit,
  PaddingWithUnit,
  ViewPadding,
  WhereOperator,
} from '../LikeC4Diagram.props'

export { Base } from '../base/Base'

export type { Types } from '../likec4diagram/types'

export {
  type EnabledFeatures,
  IfEnabled,
  IfNotEnabled,
  IfNotReadOnly,
  IfReadOnly,
  useEnabledFeatures,
} from '../context/DiagramFeatures'

export { Overlay } from '../overlays/overlay/Overlay'
export type { OverlayProps } from '../overlays/overlay/Overlay'

export { PortalToContainer } from '../components/PortalToContainer'

export { ShadowRoot } from '../shadowroot/ShadowRoot'

export { FramerMotionConfig } from '../context/FramerMotionConfig'

export { NavigationPanel } from '../components/NavigationPanel'
