import { useRef, useMemo } from 'react'
import type { DiagramApi, DiagramNode } from '../diagram/types'
import { nonNullable } from '@likec4/core'

export const useDiagramRef = () => {
  const ref = useRef<DiagramApi>(null)
  return useMemo(
    () => ({
      ref,
      ...({
        stage: () => nonNullable(ref.current, 'not mounted, use diagram.ref').stage(),
        diagramView: () => nonNullable(ref.current, 'not mounted, use diagram.ref').diagramView(),
        container: () => nonNullable(ref.current, 'not mounted, use diagram.ref').container(),
        resetStageZoom: (_immediate?: boolean) => {
          nonNullable(ref.current, 'not mounted, use diagram.ref').resetStageZoom(_immediate)
        },
        centerOnNode: (node: DiagramNode) =>
          nonNullable(ref.current, 'not mounted, use diagram.ref').centerOnNode(node),
        centerAndFit: () => nonNullable(ref.current, 'not mounted, use diagram.ref').centerAndFit()
      } satisfies DiagramApi)
    }),
    [ref]
  )
}
