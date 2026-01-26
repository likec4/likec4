declare module 'likec4:projects' {
  import type { ProjectId } from 'likec4/model'
  type Project = {
    id: ProjectId
    title?: string
  }
  export const isSingleProject: boolean
  export const projects: readonly [Project, ...Project[]]
  export function useLikeC4Projects(): readonly [Project, ...Project[]]
}

declare module 'likec4:projects-overview' {
  import type { LayoutedProjectEdge, LayoutedProjectNode, LayoutedProjectsView } from 'likec4/model'
  export type { LayoutedProjectEdge, LayoutedProjectNode, LayoutedProjectsView }

  export function useLikeC4ProjectsOverview(): LayoutedProjectsView
}

declare module 'likec4:icons' {
  import type { ReactNode } from 'react'

  export type ElementIconRendererProps = {
    node: {
      id: string
      title: string
      icon?: string | null | undefined
    }
  }

  export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode
  export const ProjectIcons: (props: ElementIconRendererProps & { projectId: string }) => ReactNode
}

declare module 'likec4:model' {
  import type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { Atom } from 'likec4/vite-plugin/internal'

  export type { Atom, DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted }

  export function loadModel(projectId: string): Promise<{
    $likec4data: Atom<LayoutedLikeC4ModelData>
    $likec4model: Atom<LikeC4Model<UnknownLayouted>>
    useLikeC4Model: () => LikeC4Model<UnknownLayouted>
    useLikeC4Views: () => ReadonlyArray<DiagramView<UnknownLayouted>>
    useLikeC4View: (viewId: string) => DiagramView<UnknownLayouted> | null
  }>
}

declare module 'likec4:single-project' {
  import type {
    DiagramView,
    LayoutedLikeC4ModelData,
    LikeC4Model,
    types,
    UnknownLayouted,
  } from 'likec4/model'
  import type { ElementIconRenderer } from 'likec4:icons'
  import type { Atom } from 'likec4:model'

  export const $likec4data: Atom<LayoutedLikeC4ModelData>
  export const $likec4model: Atom<LikeC4Model<UnknownLayouted>>
  export function useLikeC4Model(): LikeC4Model<UnknownLayouted>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<UnknownLayouted>>
  export function useLikeC4View(viewId: string): DiagramView<UnknownLayouted> | null

  export const IconRenderer: ElementIconRenderer

  export const projectId: types.ProjectId
}

declare module 'likec4:react' {
  import type { aux, DiagramView, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { LikeC4ViewProps, ReactLikeC4Props } from 'likec4/react'
  import type { JSX, PropsWithChildren } from 'react'

  // This will be used later for augmenting the types
  interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null

  export function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element
  export function LikeC4View({ viewId, ...props }: LikeC4ViewProps<Types>): JSX.Element
  export function ReactLikeC4({ viewId, ...props }: ReactLikeC4Props<Types>): JSX.Element
}

declare module 'likec4:dot' {
  export function loadDotSources(projectId: string): Promise<{
    dotSource(this: void, viewId: string): string
    svgSource(this: void, viewId: string): string
  }>
}
declare module 'likec4:d2' {
  export function loadD2Sources(projectId: string): Promise<{
    d2Source(this: void, viewId: string): string
  }>
}
declare module 'likec4:mmd' {
  export function loadMmdSources(projectId: string): Promise<{
    mmdSource(this: void, viewId: string): string
  }>
}
declare module 'likec4:puml' {
  export function loadPumlSources(projectId: string): Promise<{
    pumlSource(this: void, viewId: string): string
  }>
}

// Per project

declare module 'likec4:model/*' {
  import type { aux, DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { Atom } from 'likec4:model'

  // This will be used later for augmenting the types
  declare interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export const $likec4data: Atom<LayoutedLikeC4ModelData<Types>>
  export const $likec4model: Atom<LikeC4Model<Types>>
  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null
}

declare module 'likec4:icons/*' {
  import type { ReactNode } from 'react'
  type ElementIconRendererProps = {
    node: {
      id: string
      title: string
      icon?: string | null | undefined
    }
  }
  export function IconRenderer(props: ElementIconRendererProps): ReactNode
}

declare module 'likec4:react/*' {
  import type { aux, DiagramView, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { LikeC4ViewProps, ReactLikeC4Props } from 'likec4/react'
  import type { JSX, PropsWithChildren } from 'react'

  // This will be used later for augmenting the types
  interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null

  export function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element
  export function LikeC4View({ viewId, ...props }: LikeC4ViewProps<Types>): JSX.Element
  export function ReactLikeC4({ viewId, ...props }: ReactLikeC4Props<Types>): JSX.Element
}

declare module 'likec4:rpc' {
  import type { LikeC4VitePluginRpc } from 'likec4/vite-plugin/internal'

  export type { LikeC4VitePluginRpc }
  export declare const likec4rpc: LikeC4VitePluginRpc
}
