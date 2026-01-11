import 'vite/types/customEvent.d.ts'

declare module 'vite/types/customEvent.d.ts' {
  import type { LayoutedElementView, ProjectId, ViewChange, ViewId } from '@likec4/core'
  interface CustomEventMap {
    // Client side pushes
    'likec4:client:view:onChange': { viewId: ViewId; projectId: ProjectId; change: ViewChange }
    'likec4:client:adhoc:predicates': { id: string; projectId: ProjectId; predicates: any[] }
    // Server side pushes (response to adhoc:predicates)
    'likec4:server:adhoc:view': { id: string; view: LayoutedElementView }
  }
}
