import '@mantine/core/styles.css'
import '@mantine/spotlight/styles.css'
import '@xyflow/react/dist/style.css'

export { LikeC4Browser, type LikeC4BrowserProps } from './LikeC4Browser'

export { LikeC4ViewEmbedded, type LikeC4ViewEmbeddedProps } from './LikeC4ViewEmbedded'
export { ReactLikeC4, type ReactLikeC4Props } from './ReactLikeC4'

export * as nano from './nanostores'

export { BundledStyles, DefaultTheme, useBundledStyleSheet, useColorScheme } from './style'

export {
  LikeC4ModelProvider,
  useLikeC4DiagramView,
  useLikeC4Model,
  useLikeC4View,
  useLikeC4ViewModel,
  useLikeC4Views
} from '@likec4/diagram'

export { createLikeC4Model, LikeC4Model } from './createLikeC4Model'

export type * from './types'
