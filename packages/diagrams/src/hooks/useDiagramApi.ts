import { nonNullable } from '@likec4/core'
import { useRef, useState } from 'react'
import type { DiagramApi, DiagramNode } from '../diagram/types'

export function useDiagramApi() {
  const ref = useRef<DiagramApi>(null)
  const [api] = useState<DiagramApi>(
    () =>
      ({
        get stage() {
          return ref.current?.stage ?? null
        },
        get diagramView() {
          return nonNullable(ref.current, 'not mounted, use ref').diagramView
        },
        get container() {
          return ref.current?.container ?? null
        },
        resetStageZoom: (_immediate?: boolean) => {
          nonNullable(ref.current, 'not mounted, use ref').resetStageZoom(_immediate)
        },
        centerOnNode: (node: DiagramNode) =>
          nonNullable(ref.current, 'not mounted, use ref').centerOnNode(node),
        centerAndFit: () => nonNullable(ref.current, 'not mounted, use ref').centerAndFit()
      }) satisfies DiagramApi
  )
  return [ref, api] as const
}
