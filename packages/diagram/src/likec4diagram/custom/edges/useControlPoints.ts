import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { useState } from 'react'
import { useCallbackRef } from '../../../hooks/useCallbackRef'
import { useUpdateEffect } from '../../../hooks/useUpdateEffect'
import { initialControlPoints, insertCorner } from '../../../utils/edge-corners'
import type { Types } from '../../types'

export function useControlPoints({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: Types.EdgeProps<'relationship'>, routing: EdgeRouting) {
  const [controlPoints, setControlPoints] = useState<XYPosition[]>(() =>
    data.controlPoints ?? initialControlPoints(data.points, routing)
  )
  useUpdateEffect(() => {
    const next = data.controlPoints ?? initialControlPoints(data.points, routing)
    setControlPoints(prev => deepEqual(prev, next) ? prev : next)
  }, [
    data.points,
    data.controlPoints ?? [],
    routing,
  ])

  /**
   * Inserts a control point at the clicked position, expressed in diagram coordinates.
   */
  const insertControlPoint = useCallbackRef((point: XYPosition) => {
    const newControlPoints = insertCorner({
      point,
      controlPoints,
      source: { x: sourceX, y: sourceY },
      target: { x: targetX, y: targetY },
      dir: data.dir,
      routing,
    })
    setControlPoints(newControlPoints)
    return newControlPoints
  })

  return {
    controlPoints,
    setControlPoints,
    insertControlPoint,
  }
}
