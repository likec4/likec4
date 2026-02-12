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
  OnEdgeClick,
  OnInitialized,
  OnNavigateTo,
  OnNodeClick,
  OnOpenSource,
  PaddingWithUnit,
  ViewPadding,
  ViewPaddings,
  WhereOperator,
} from './LikeC4Diagram.props'

export {
  LikeC4ModelProvider,
  type LikeC4ModelProviderProps,
} from './LikeC4ModelProvider'

export {
  LikeC4EditorProvider,
  type LikeC4EditorProviderProps,
} from './editor/LikeC4EditorProvider'

export {
  createLikeC4Editor,
  type LikeC4EditorCallbacks,
} from './editor/LikeC4EditorCallbacks'

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

export {
  type CurrentViewModel,
  useCurrentViewModel,
  useOptionalCurrentViewModel,
} from './hooks/useCurrentViewModel'

export {
  useChangeLikeC4Project,
  useHasProjects,
  useLikeC4Project,
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

export {
  useCurrentView,
  useCurrentViewId,
} from './hooks/useCurrentView'

export { pickViewBounds } from './utils/view-bounds'

export {
  LikeC4ProjectsOverview,
  type LikeC4ProjectsOverviewProps,
} from './LikeC4ProjectsOverview'
