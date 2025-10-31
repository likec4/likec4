export { IconRendererProvider } from './context/IconRenderer'

export {
  LikeC4Diagram,
  type LikeC4DiagramProps,
} from './LikeC4Diagram'

export type {
  ElementIconRenderer,
  ElementIconRendererProps,
  LikeC4ColorScheme,
  NodeRenderers,
  OnCanvasClick,
  OnChange,
  OnEdgeClick,
  OnInitialized,
  OnNavigateTo,
  OnNodeClick,
  OnOpenSource,
  PaddingWithUnit,
  ViewPadding,
  WhereOperator,
} from './LikeC4Diagram.props'

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

export type { Types } from './likec4diagram/types'

export { StaticLikeC4Diagram } from './StaticLikeC4Diagram'

export { LikeC4View } from './LikeC4View'

export type { LikeC4BrowserProps, LikeC4ViewProps } from './LikeC4View'

export { ReactLikeC4, type ReactLikeC4Props } from './ReactLikeC4'

export { useCurrentViewId } from './hooks/useCurrentView'

export { getViewBounds } from './utils/view-bounds'
