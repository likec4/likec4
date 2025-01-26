import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView, ViewId } from '@likec4/core/types'
import {
  type LikeC4ViewProps,
  type ReactLikeC4Props as GenericReactLikeC4Props,
  LikeC4ModelProvider as GenericLikeC4ModelProvider,
  LikeC4View as GenericLikeC4View,
  ReactLikeC4 as GenericReactLikeC4,
} from 'likec4/react'
import { type PropsWithChildren } from 'react'
import { Icons } from 'virtual:likec4/icons'
import { likeC4Model, LikeC4Views, useLikeC4Model } from 'virtual:likec4/model'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
}

export function RenderIcon({ node }: IconRendererProps) {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}

export { likeC4Model, useLikeC4Model }

export function useLikeC4ViewModel(viewId: ViewId): LikeC4Model.View {
  return useLikeC4Model().view(viewId as any)
}

export function useLikeC4View(viewId: ViewId): DiagramView {
  return useLikeC4Model().view(viewId as any).$view as DiagramView
}
export function isLikeC4ViewId(value: unknown): value is ViewId {
  return (
    value != null
    && typeof value === 'string'
    && value in LikeC4Views
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
        renderIcon={RenderIcon}
        {...props} />
    </LikeC4ModelProvider>
  )
}

type ReactLikeC4Props = Omit<GenericReactLikeC4Props<string, string, string>, 'renderIcon'>

export function ReactLikeC4(props: ReactLikeC4Props) {
  return (
    <LikeC4ModelProvider>
      <GenericReactLikeC4
        renderIcon={RenderIcon}
        {...props}
      />
    </LikeC4ModelProvider>
  )
}
