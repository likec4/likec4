import type { DiagramEdge, DiagramNode, EdgeId } from '@likec4/core/types'
import { groupBy, mapValues, pipe, values } from 'remeda'

export type Step = {
  id: EdgeId
  from: {
    column: number
    row: number
  }
  to: {
    column: number
    row: number
  }
  source: DiagramNode
  target: DiagramNode
  label: null | {
    height: number
    width: number
    text: string | null
  }
  isSelfLoop: boolean
  isBack: boolean
  parallelPrefix: string | null
  offset: number // offset for continuing edges
  edge: DiagramEdge
}

export type ParallelRect = {
  parallelPrefix: string
  min: {
    column: number
    row: number
  }
  max: {
    column: number
    row: number
  }
}

/**
 * From steps find boxes that must be marked as parallel on the layout
 */
export function findParallelRects(steps: Array<Step>): Array<ParallelRect> {
  return pipe(
    steps,
    groupBy(s => s.parallelPrefix ?? undefined),
    mapValues((steps, parallelPrefix) => {
      return steps.reduce(
        (acc, step) => {
          acc.min.column = Math.min(acc.min.column, step.from.column, step.to.column)
          acc.min.row = Math.min(acc.min.row, step.from.row, step.to.row)

          acc.max.column = Math.max(acc.max.column, step.from.column, step.to.column)
          acc.max.row = Math.max(acc.max.row, step.from.row, step.to.row)

          return acc
        },
        {
          parallelPrefix,
          min: {
            column: Infinity,
            row: Infinity,
          },
          max: {
            column: -Infinity,
            row: -Infinity,
          },
        } as ParallelRect,
      )
    }),
    values(),
  )
}
