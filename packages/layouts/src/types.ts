import type { ComputedView, DiagramView } from '@likec4/core/types'

export type DiagramLayoutFn = (view: ComputedView) => Promise<DiagramView>
