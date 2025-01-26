import '@xyflow/react/dist/style.css'

export { FramerMotionConfig } from './context/FramerMotionConfig'
export { LikeC4Diagram } from './LikeC4Diagram'
export type { LikeC4DiagramProps } from './LikeC4Diagram'
export { Overlay } from './overlays/overlay/Overlay'

export {
  useLikeC4ElementsTree,
  useLikeC4Model,
} from './likec4model'

export { LikeC4ModelProvider } from './LikeC4ModelProvider'

export { useSetState } from './hooks/useSetState'
export { useUpdateEffect } from './hooks/useUpdateEffect'
export { vars, xyvars } from './theme-vars'

export type * from './LikeC4Diagram.props'

export { StaticLikeC4Diagram } from './StaticLikeC4Diagram'
export type { StaticLikeC4DiagramProps } from './StaticLikeC4Diagram'
