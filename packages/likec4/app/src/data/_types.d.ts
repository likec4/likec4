declare module '~likec4' {
  import type { DiagramView as OriginalDiagramView } from '@likec4/core'

  export { OriginalDiagramView }

  export interface DiagramView extends Omit<OriginalDiagramView, 'docUri'> {
    docUri: string
    /**
     * Path segments to the document, relative to the workspace root.
     */
    docPath: string[]
  }

  export const LikeC4Views: Record<string, DiagramView>
}
