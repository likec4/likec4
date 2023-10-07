import type { ComputedView, DiagramView } from '@likec4/core'

export type DiagramLayoutFn = (view: ComputedView) => Promise<DiagramView>
