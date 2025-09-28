import type { DynamicViewDisplayVariant, LayoutedView, WhereOperator } from '@likec4/core/types'
import type { Types } from './types'
import { diagramToXY } from './xyflow-diagram/diagram-view'
import { sequenceLayoutToXY } from './xyflow-sequence/sequence-layout'

type ConvertToXYFlowInput = {
  view: LayoutedView
  where: WhereOperator | null
  nodesSelectable: boolean
  dynamicViewVariant: DynamicViewDisplayVariant
}

export function convertToXYFlow({ dynamicViewVariant, ...params }: ConvertToXYFlowInput): {
  view: LayoutedView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const view = params.view
  const isDynamic = view._type === 'dynamic'

  const { bounds, xynodes, xyedges } = isDynamic && dynamicViewVariant === 'sequence'
    ? sequenceLayoutToXY(view)
    : diagramToXY(params)

  if (isDynamic && view.variant !== dynamicViewVariant) {
    return {
      view: {
        ...view,
        bounds,
        variant: dynamicViewVariant,
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
