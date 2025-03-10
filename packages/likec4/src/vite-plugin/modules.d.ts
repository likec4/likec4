declare module 'virtual:likec4/projects' {
  import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
  export const isSingleProject: boolean
  export const projects: NonEmptyReadonlyArray<ProjectId>
}

declare module 'virtual:likec4/icons' {
  import type { ElementIconRenderer } from '@likec4/diagram'
  export const ProjectIcons: (projectId: string) => ElementIconRenderer
}

declare module 'virtual:likec4/model' {
  import type { LayoutedLikeC4ModelData, LikeC4Model } from '@likec4/core'
  import type { Atom } from 'nanostores'

  export function loadModel(projectId: string): Promise<{
    $likec4data: Atom<LayoutedLikeC4ModelData>
    $likec4model: Atom<LikeC4Model.Layouted>
  }>
}

declare module 'virtual:likec4/single-project' {
  import type { ProjectId } from '@likec4/core'
  import type { ElementIconRenderer } from '@likec4/diagram'

  export const $likec4data: Atom<LayoutedLikeC4ModelData>
  export const $likec4model: Atom<LikeC4Model.Layouted>
  export const IconRenderer: ElementIconRenderer

  export const projectId: ProjectId
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

// declare module 'virtual:likec4/model/*.js' {
//   import type { DiagramView as CoreDiagramView, LikeC4Model } from '@likec4/core'

//   export type LikeC4ViewId = 'likec4-view-id'

//   export type LikeC4Tag = 'likec4-tag'

//   export type LikeC4ElementKind = 'likec4-element-kind'

//   export type DiagramView<ViewId extends LikeC4ViewId = LikeC4ViewId> = CoreDiagramView<ViewId>

//   export const LikeC4Views: Record<LikeC4ViewId, DiagramView>

//   export const likeC4Model: LikeC4Model.Layouted

//   export function useLikeC4Model(): LikeC4Model.Layouted
// }
