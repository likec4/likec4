import type { LikeC4Model } from '@likec4/core'
import type { DiagramView, ViewId } from '@likec4/core'
import {
  type LikeC4ViewProps,
  type ReactLikeC4Props as GenericReactLikeC4Props,
  LikeC4ModelProvider as GenericLikeC4ModelProvider,
  LikeC4View as GenericLikeC4View,
  nano,
  ReactLikeC4 as GenericReactLikeC4,
} from 'likec4/react'
import { type PropsWithChildren } from 'react'
import { $likec4model, IconRenderer } from 'virtual:likec4/single-project'

export { IconRenderer as RenderIcon }

export function useLikeC4Model(): LikeC4Model.Layouted {
  return nano.useStore($likec4model)
}

export function useLikeC4ViewModel(viewId: ViewId): LikeC4Model.View {
  return useLikeC4Model().view(viewId as any)
}

export function useLikeC4View(viewId: ViewId): DiagramView {
  return useLikeC4Model().view(viewId as any).$view as DiagramView
}
export function isLikeC4ViewId(value: unknown): value is ViewId {
  const model = $likec4model.get()
  return (
    value != null
    && typeof value === 'string'
    && !!model.findView(value)
  )
}

export function LikeC4ModelProvider({ children }: PropsWithChildren) {
  const likeC4Model = useLikeC4Model()
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
