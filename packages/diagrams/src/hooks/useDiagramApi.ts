import { useRef, useMemo } from 'react'
import type { DiagramApi, DiagramNode } from '../diagram/types'
import { nonNullable } from '@likec4/core'

export function useDiagramApi() {
  const ref = useRef<DiagramApi>(null)
  return useMemo(
    () =>
      [
        ref,
        {
          get stage() {
            return nonNullable(ref.current, 'not mounted, use ref').stage
          },
          get diagramView() {
            return nonNullable(ref.current, 'not mounted, use ref').diagramView
          },
          get container() {
            return nonNullable(ref.current, 'not mounted, use ref').container
          },
          resetStageZoom: (_immediate?: boolean) => {
            nonNullable(ref.current, 'not mounted, use ref').resetStageZoom(_immediate)
          },
          centerOnNode: (node: DiagramNode) =>
            nonNullable(ref.current, 'not mounted, use ref').centerOnNode(node),
          centerAndFit: () => nonNullable(ref.current, 'not mounted, use ref').centerAndFit()
        } satisfies DiagramApi
      ] as const,
    [ref]
  )
}
