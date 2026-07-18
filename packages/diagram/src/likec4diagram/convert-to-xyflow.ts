import type { DynamicViewDisplayVariant, LayoutedView, StepPath, ViewId, WhereOperator } from '@likec4/core/types'
import { entries, filter, identity, map, piped, reduce } from 'remeda'
import type { DiagramContext } from './state/types'
import type { Types } from './types'
import { diagramToXY } from './xyflow-diagram/diagram-view'
import { sequenceLayoutToXY } from './xyflow-sequence/sequence-layout'

type ConvertToXYFlowInput = Pick<DiagramContext, 'view' | 'where' | 'dynamicViewVariant' | 'collapsedSequenceFlows'> & {
  currentViewId: ViewId | undefined
}

const collapsedFlows = piped(
  identity()<DiagramContext['collapsedSequenceFlows']>,
  entries(),
  filter(([_, collapsed]) => collapsed),
  map(([flowId]) => flowId),
)

export function convertToXYFlow({ dynamicViewVariant, ...params }: ConvertToXYFlowInput): {
  view: LayoutedView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const view = params.view
  const isDynamic = view._type === 'dynamic'

  if (isDynamic && dynamicViewVariant !== 'sequence') {
    const { xynodes, xyedges } = diagramToXY(params)
    return {
      view: view.variant !== 'diagram' ?
        {
          ...view,
          variant: 'diagram',
        } :
        view,
      xynodes,
      xyedges,
    }
  }

  if (isDynamic && dynamicViewVariant === 'sequence') {
    const { xynodes, xyedges, layout } = sequenceLayoutToXY({
      view,
      currentViewId: params.currentViewId,
      collapsedFlows: collapsedFlows(params.collapsedSequenceFlows),
    })
    return {
      view: {
        ...view,
        sequenceLayout: layout,
        variant: dynamicViewVariant,
      },
      xynodes,
      xyedges,
    }
  }

  const { xynodes, xyedges } = diagramToXY(params)

  return {
    view,
    xynodes,
    xyedges,
  }
}
