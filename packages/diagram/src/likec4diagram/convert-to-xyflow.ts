import type { DynamicViewDisplayVariant, LayoutedView, ViewId, WhereOperator } from '@likec4/core/types'
import type { Types } from './types'
import { diagramToXY } from './xyflow-diagram/diagram-view'
import { sequenceLayoutToXY } from './xyflow-sequence/sequence-layout'

type ConvertToXYFlowInput = {
  currentViewId: ViewId | undefined
  view: LayoutedView
  where: WhereOperator | null
  dynamicViewVariant: DynamicViewDisplayVariant
}

export function convertToXYFlow({ dynamicViewVariant, ...params }: ConvertToXYFlowInput): {
  view: LayoutedView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const view = params.view
  const isDynamic = view._type === 'dynamic'

  const { xynodes, xyedges } = isDynamic && dynamicViewVariant === 'sequence'
    ? sequenceLayoutToXY(view, params.currentViewId)
    : diagramToXY({ ...params })

  if (isDynamic && view.variant !== dynamicViewVariant) {
    return {
      view: {
        ...view,
        variant: dynamicViewVariant,
      },
      xynodes,
      xyedges,
    }
  }

  return {
    view,
    xynodes,
    xyedges,
  }
}
