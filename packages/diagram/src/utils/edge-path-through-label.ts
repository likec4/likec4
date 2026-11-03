import type { BBox } from '@likec4/core/types'
import { type GetBezierPathParams, getBezierPath, Position } from '@xyflow/system'

export type EdgeLabelPosition = {
  x: number
  y: number
  translate?: string
}

/**
 * Returns the bezier edge path through the label placed by the layout (left to right):
 * a curve to the left side of the label and a curve from its right side to the target,
 * with a gap under the label, so the line does not show through the label background.
 *
 * Without label box, it is a single bezier curve with the label in the middle.
 */
export function edgePathThroughLabel(
  params: Pick<
    Required<GetBezierPathParams>,
    'sourceX' | 'sourceY' | 'sourcePosition' | 'targetX' | 'targetY' | 'targetPosition'
  >,
  labelBBox: BBox | null | undefined,
): [path: string, labelPosition: EdgeLabelPosition] {
  if (!labelBBox) {
    const [path, x, y] = getBezierPath({
      sourceX: params.sourceX,
      sourceY: params.sourceY,
      sourcePosition: params.sourcePosition,
      targetX: params.targetX,
      targetY: params.targetY,
      targetPosition: params.targetPosition,
    })
    return [path, { x, y, translate: 'translate(-50%, 0)' }]
  }
  const y = labelBBox.y + labelBBox.height / 2
  const [toLabel] = getBezierPath({
    sourceX: params.sourceX,
    sourceY: params.sourceY,
    sourcePosition: params.sourcePosition,
    targetX: labelBBox.x,
    targetY: y,
    targetPosition: Position.Left,
  })
  const [fromLabel] = getBezierPath({
    sourceX: labelBBox.x + labelBBox.width,
    sourceY: y,
    sourcePosition: Position.Right,
    targetX: params.targetX,
    targetY: params.targetY,
    targetPosition: params.targetPosition,
  })
  return [`${toLabel} ${fromLabel}`, { x: labelBBox.x, y: labelBBox.y }]
}
