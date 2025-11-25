import type { XYPosition } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { useState } from 'react'
import { useCallbackRef } from '../../../hooks/useCallbackRef'
import { useUpdateEffect } from '../../../hooks/useUpdateEffect'
import { type Vector, vector } from '../../../utils/vector'
import {
  bezierControlPoints,
} from '../../../utils/xyflow'
import type { Types } from '../../types'

export function useControlPoints({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: Types.EdgeProps<'relationship'>) {
  const [controlPoints, setControlPoints] = useState<XYPosition[]>(() =>
    data.controlPoints ?? bezierControlPoints(data.points)
  )
  useUpdateEffect(() => {
    const next = data.controlPoints ?? bezierControlPoints(data.points)
    setControlPoints(prev => deepEqual(prev, next) ? prev : next)
  }, [
    data.controlPoints?.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join('|') ?? '',
    data.points.map(p => `${Math.round(p[0])},${Math.round(p[1])}`).join('|'),
  ])

  /**
   * Find index where to insert new control point
   * coordinates must be in flow space
   */
  const insertControlPoint = useCallbackRef(({ x, y }: XYPosition) => {
    const sourceV = vector(sourceX, sourceY)
    const targetV = vector(targetX, targetY)

    const points: Vector[] = [
      data.dir === 'back' ? targetV : sourceV,
      ...controlPoints.map(vector) || [],
      data.dir === 'back' ? sourceV : targetV,
    ]

    const newPointV = vector(x, y).round()

    let insertionIndex = 0
    let minDistance = Infinity
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!,
        b = points[i + 1]!,
        fromCurrentToNext = b.subtract(a),
        fromCurrentToNew = newPointV.subtract(a),
        fromNextToNew = newPointV.subtract(b)

      // Is pointer above the current segment?
      if (fromCurrentToNext.dot(fromCurrentToNew) * fromCurrentToNext.dot(fromNextToNew) < 0) {
        // Calculate distance by approximating edge segment with a staight line
        const distanceToEdge = Math.abs(fromCurrentToNext.cross(fromCurrentToNew).length() / fromCurrentToNext.length())

        if (distanceToEdge < minDistance) {
          minDistance = distanceToEdge
          insertionIndex = i
        }
      }
    }
    const newControlPoints = controlPoints.slice()
    newControlPoints.splice(insertionIndex, 0, { x: newPointV.x, y: newPointV.y })

    setControlPoints(newControlPoints)

    return newControlPoints
  })

  return {
    controlPoints,
    setControlPoints,
    insertControlPoint,
  }
}
