export type { ControlsCustomLayout, ControlsCustomLayoutProps } from './context/ControlsCustomLayout'
export { FramerMotionConfig } from './context/FramerMotionConfig'
export { IconRendererProvider } from './context/IconRenderer'

export {
  LikeC4Diagram,
  type LikeC4DiagramProps,
} from './LikeC4Diagram'

export {
  LikeC4ModelProvider,
  type LikeC4ModelProviderProps,
} from './LikeC4ModelProvider'

export {
  LikeC4ProjectsProvider,
  type LikeC4ProjectsProviderProps,
} from './LikeC4ProjectsProvider'

export {
  type DiagramApi,
  type DiagramContext,
  useDiagram,
  useDiagramContext,
  useOnDiagramEvent,
} from './hooks/useDiagram'

export {
  useLikeC4Model,
  useLikeC4Specification,
  useLikeC4ViewModel,
} from './hooks/useLikeC4Model'

export { useCurrentViewModel } from './hooks/useCurrentViewModel'

export {
  useHasProjects,
  useLikeC4ProjectId,
  useLikeC4Projects,
  useLikeC4ProjectsContext,
} from './hooks/useLikeC4Project'

export { useLikeC4Styles } from './hooks/useLikeC4Styles'

export { useUpdateEffect } from './hooks/useUpdateEffect'

export type {
  ChangeEvent,
  DiagramNodeWithNavigate,
  ElementIconRenderer,
  ElementIconRendererProps,
  LikeC4ColorScheme,
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProperties,
  NodeRenderers,
  OnCanvasClick,
  OnChange,
  OnEdgeClick,
  OnNavigateTo,
  OnNodeClick,
  OpenSourceParams,
  PaddingUnit,
  PaddingWithUnit,
  WhereOperator,
} from './LikeC4Diagram.props'

export type { Types } from './likec4diagram/types'

export { StaticLikeC4Diagram } from './StaticLikeC4Diagram'

export { PortalDiagramContainer } from './components/PortalDiagramContainer'

export { LikeC4View } from './LikeC4View'

export type { LikeC4BrowserProps, LikeC4ViewProps } from './LikeC4View'

export { ReactLikeC4, type ReactLikeC4Props } from './ReactLikeC4'

export { useCurrentViewId } from './hooks/useCurrentViewId'

export {
  type EnabledFeatures,
  IfEnabled,
  IfNotEnabled,
  IfNotReadOnly,
  IfReadOnly,
  useEnabledFeatures,
} from './context/DiagramFeatures'

export type * as base from './base/types'
export * as builtins from './custom/builtins'
export * as custom from './custom/customNodes'
export * as primitives from './custom/primitives'

export { ShadowRoot } from './shadowroot/ShadowRoot'
