import type { DynamicViewDisplayVariant, LayoutedView, WhereOperator } from '@likec4/core/types'
import type { Types } from './types'
import { diagramToXY } from './xyflow-diagram/diagram-view'
import { sequenceViewToXY } from './xyflow-sequence/sequence-view'

type ConvertToXYFlowInput = {
  view: LayoutedView
  where: WhereOperator | null
  nodesSelectable: boolean
  dynamicViewMode: DynamicViewDisplayVariant
}

export function convertToXYFlow({ dynamicViewMode, ...params }: ConvertToXYFlowInput): {
  view: LayoutedView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const view = params.view
  const isDynamic = view._type === 'dynamic'

  const { bounds, xynodes, xyedges } = isDynamic && dynamicViewMode === 'sequence'
    ? sequenceViewToXY(view)
    : diagramToXY(params)

  if (isDynamic && view.mode !== dynamicViewMode) {
    return {
      view: {
        ...view,
        bounds,
        mode: dynamicViewMode,
      },
      xynodes,
      xyedges,
    }
  }

  return {
    view: bounds === view.bounds ? view : {
      ...view,
      bounds,
    },
    xynodes,
    xyedges,
  }
}
