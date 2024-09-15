import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

export { LikeC4Browser, type LikeC4BrowserProps } from './LikeC4Browser'
export {
  createLikeC4Model,
  LikeC4ModelProvider,
  useLikeC4Model,
  useLikeC4View,
  useLikeC4ViewModel,
  useLikeC4Views
} from './LikeC4ModelProvider'

export { LikeC4ViewEmbedded, type LikeC4ViewEmbeddedProps } from './LikeC4ViewEmbedded'
export { ReactLikeC4, type ReactLikeC4Props } from './ReactLikeC4'

export * from './nanostores'

export type * from './types'

export { BundledStyles, DefaultTheme, useBundledStyleSheet, useColorScheme } from './style'
