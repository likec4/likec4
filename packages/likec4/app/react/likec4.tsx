import type { ViewId } from '@likec4/core'
import {
  type LikeC4ViewProps,
  type ReactLikeC4Props as GenericReactLikeC4Props,
  LikeC4ModelProvider as GenericLikeC4ModelProvider,
  LikeC4View as GenericLikeC4View,
  ReactLikeC4 as GenericReactLikeC4,
} from 'likec4/react'
import { $likec4data, $likec4model, IconRenderer } from 'likec4:single-project'
import { type PropsWithChildren } from 'react'

export const likeC4Model = $likec4model.get()

export {
  IconRenderer as RenderIcon,
  useLikeC4Model,
  useLikeC4View,
} from 'likec4:single-project'

export function isLikeC4ViewId(value: unknown): value is ViewId {
  const model = $likec4data.get()
  return (
    value != null
    && typeof value === 'string'
    && !!model.views[value]
  )
}

export function LikeC4ModelProvider({ children }: PropsWithChildren) {
  return (
    <GenericLikeC4ModelProvider likec4model={likeC4Model}>
      {children}
    </GenericLikeC4ModelProvider>
  )
}

export function LikeC4View(props: LikeC4ViewProps<string, string, string>) {
  return (
    <LikeC4ModelProvider>
      <GenericLikeC4View
        renderIcon={IconRenderer}
        {...props} />
    </LikeC4ModelProvider>
  )
}

type ReactLikeC4Props = Omit<GenericReactLikeC4Props<string, string, string>, 'renderIcon'>

export function ReactLikeC4(props: ReactLikeC4Props) {
  return (
    <LikeC4ModelProvider>
      <GenericReactLikeC4
        renderIcon={IconRenderer}
        {...props}
      />
    </LikeC4ModelProvider>
  )
}
