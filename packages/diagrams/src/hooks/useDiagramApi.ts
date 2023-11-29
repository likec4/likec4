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
        resetStageZoom: (_immediate?: boolean) =>
          nonNullable(ref.current, 'not mounted, use ref').resetStageZoom(_immediate),
        centerOnNode: (node: DiagramNode, opts?: DiagramApi.CenterMethodOptions) =>
          nonNullable(ref.current, 'not mounted, use ref').centerOnNode(node, opts),
        centerOnRect: (rect, opts) =>
          nonNullable(ref.current, 'not mounted, use ref').centerOnRect(rect, opts),
        centerAndFit: (opts?: DiagramApi.CenterMethodOptions) =>
          nonNullable(ref.current, 'not mounted, use ref').centerAndFit(opts)
      }) satisfies DiagramApi
  )
  return [ref, api] as const
}
