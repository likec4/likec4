import type { JSX } from 'react'
import type { LikeC4BrowserProps, LikeC4ViewBaseProps, LikeC4ViewElementProp } from './components/index'

declare module 'likec4/react' {
  export type { LikeC4ViewBaseProps }

  export function LikeC4ViewElement<ViewId extends string>(props: LikeC4ViewElementProps<ViewId>): JSX.Element
  export function LikeC4Browser<ViewId extends string>(props: LikeC4BrowserProps<ViewId>): JSX.Element

  export function useColorScheme(explicit?: 'light' | 'dark'): 'light' | 'dark'
}
