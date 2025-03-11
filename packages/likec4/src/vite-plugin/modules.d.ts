declare module 'virtual:likec4/projects' {
  export const isSingleProject: boolean
  export const projects: readonly [string, ...string[]]
}

declare module 'virtual:likec4/icons' {
  import type { ReactNode } from 'react'
  type ElementIconRendererProps = {
    node: {
      id: string
      title: string
      icon?: string | null | undefined
    }
  }

  export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

  export const ProjectIcons: (projectId: string) => ElementIconRenderer
}

declare module 'virtual:likec4/model' {
  import type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model } from 'likec4/model'
  import type { nano } from 'likec4/react'

  export type Atom<T> = nano.Atom<T>

  export type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model }

  export function loadModel(projectId: string): Promise<{
    $likec4data: Atom<LayoutedLikeC4ModelData>
    $likec4model: Atom<LikeC4Model.Layouted>
    useLikeC4Model: () => LikeC4Model.Layouted
    useLikeC4Views: () => ReadonlyArray<DiagramView>
    useLikeC4View: (viewId: string) => DiagramView | null
  }>
}

declare module 'virtual:likec4/single-project' {
  import type { ElementIconRenderer } from 'virtual:likec4/icons'
  import type { Atom, DiagramView, LayoutedLikeC4ModelData, LikeC4Model } from 'virtual:likec4/model'

  export const $likec4data: Atom<LayoutedLikeC4ModelData>
  export const $likec4model: Atom<LikeC4Model.Layouted>
  export function useLikeC4Model(): LikeC4Model.Layouted
  export function useLikeC4Views(): ReadonlyArray<DiagramView>
  export function useLikeC4View(viewId: string): DiagramView | null

  export const IconRenderer: ElementIconRenderer

  export const projectId: string
}

declare module 'virtual:likec4' {
  import type { Aux, DiagramView, LikeC4Model } from 'likec4/model'
  import type { LikeC4ViewProps, ReactLikeC4Props } from 'likec4/react'
  import type { JSX, PropsWithChildren } from 'react'

  interface Types extends Aux<string, string, string, DiagramView> {
  }

  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types['View']>>
  export function useLikeC4View(viewId: Types['View']): DiagramView | null

  export function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element
  export function LikeC4View({ viewId, ...props }: LikeC4ViewProps<Types['View']>): JSX.Element
  export function ReactLikeC4({ viewId, ...props }: ReactLikeC4Props<Types['View']>): JSX.Element
}

declare module 'virtual:likec4/dot' {
  export function loadDotSources(projectId: string): Promise<{
    dotSource(viewId: string): string
    svgSource(viewId: string): string
  }>
}
declare module 'virtual:likec4/d2' {
  export function loadD2Sources(projectId: string): Promise<{
    d2Source(viewId: string): string
  }>
}
declare module 'virtual:likec4/mmd' {
  export function loadMmdSources(projectId: string): Promise<{
    mmdSource(viewId: string): string
  }>
}
