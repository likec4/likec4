import {
  type BBox,
  type DiagramNode,
  type NonEmptyArray,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { last } from 'remeda'
import type { Compound, ParallelRect, Step } from './_types'
import {
  ACTOR_GAP,
  COLUMN_GAP,
  FIRST_STEP_OFFSET,
  MIN_ROW_HEIGHT,
  PORT_HEIGHT,
  STEP_LABEL_MARGIN,
} from './const'
import { findParallelRects } from './utils'

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

interface CompoundRect {
  node: DiagramNode
  depth: number
  // Top-left
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
  // Bottom-right
  x2: kiwi.Expression | kiwi.Variable
  y2: kiwi.Expression | kiwi.Variable
}

interface ActorBox {
  column: number
  actor: DiagramNode
  x: kiwi.Variable
  y: kiwi.Variable
  centerX: kiwi.Expression
  centerY: kiwi.Expression
  width: number
  height: number
  right: kiwi.Expression
  bottom: kiwi.Expression
}

export class SequenceViewLayouter {
  #solver = new kiwi.Solver()

  #actors = new DefaultMap<DiagramNode, ActorBox>(actor => {
    // Map filled in constructor
    throw new Error(`actor ${actor.id} not expected`)
  })

  #compounds = [] as Array<CompoundRect>

  #actorsRect = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  }

  /**
   * The minimum and maximum X and Y positions of each column
   */
  #columnRects = [] as Array<{
    readonly actorBox: ActorBox
    readonly index: number
    readonly min: {
      x: kiwi.Expression | kiwi.Variable
      y: kiwi.Expression | kiwi.Variable
    }
    readonly max: {
      x: kiwi.Expression | kiwi.Variable
      y: kiwi.Expression | kiwi.Variable
    }
    readonly centerX: kiwi.Expression
  }>
  private column(column: number | DiagramNode) {
    if (typeof column !== 'number') {
      column = this.#actors.get(column).column
    }
    return nonNullable(this.#columnRects[column], `columnRect ${column} not found`)
  }

  #rowsTop: kiwi.Variable
  #rows = [] as Array<{
    y: kiwi.Variable
    height: kiwi.Variable
    bottom: kiwi.Expression
    lastHeight: number
  }>

  #parallelBoxes = [] as Array<{
    parallelPrefix: string
    x1: kiwi.Expression
    y1: kiwi.Expression
    x2: kiwi.Expression
    y2: kiwi.Expression
  }>

  constructor({
    actors,
    steps,
    compounds,
  }: {
    actors: Array<DiagramNode>
    steps: Array<Step>
    compounds: Array<Compound>
  }) {
    this.#rowsTop = this.newVar(FIRST_STEP_OFFSET)

    this.addActors(actors)

    for (const compound of compounds) {
      this.#compounds.push(...this.addCompound(compound))
    }

    for (const step of steps) {
      this.addStep(step)
    }

    for (const parallelRect of findParallelRects(steps)) {
      this.addParallelRect(parallelRect)
    }

    if (compounds.length > 0) {
      const firstColumn = this.column(1)
      this.require(firstColumn.min.x, '>= 0')
      this.constraint(firstColumn.min.y, '>= 0')
      this.constraint(this.#rowsTop, '>=', firstColumn.max.y)
      // ensure gap between columns
      for (let index = 1; index < this.#columnRects.length; index++) {
        const prev = this.column(index - 1)
        const current = this.column(index)
        this.require(
          prev.max.x.plus(COLUMN_GAP),
          '<=',
          current.min.x,
        )
        this.constraint(this.#rowsTop, '>=', current.max.y)
      }
    }

    const lastRow = last(this.#rows)
    if (lastRow) {
      this.#compounds.forEach(compound => {
        if (compound.depth === 0) {
          this.require(compound.y2, '>=', lastRow.bottom.plus(COLUMN_GAP))
        }
      })
    }

    this.#solver.updateVariables()
    this.recalcActorsRect()
  }

  getParallelBoxes(): Array<BBox & { parallelPrefix: string }> {
    return this.#parallelBoxes.map(({ parallelPrefix, x1, y1, x2, y2 }) => ({
      parallelPrefix,
      x: x1.value(),
      y: y1.value(),
      width: x2.value() - x1.value(),
      height: y2.value() - y1.value(),
    }))
  }

  getActorBox(actor: DiagramNode): BBox {
    const actorBox = this.#actors.get(actor)
    return {
      x: actorBox.x.value(),
      y: actorBox.y.value(),
      width: actorBox.width,
      height: actorBox.height,
    }
  }

  getCompoundBoxes(): Array<BBox & { node: DiagramNode; depth: number }> {
    return this.#compounds.map(({ node, depth, x1, y1, x2, y2 }) => ({
      node,
      depth,
      x: x1.value(),
      y: y1.value(),
      width: x2.value() - x1.value(),
      height: y2.value() - y1.value(),
    }))
  }

  getPortCenter(step: Step, type: 'source' | 'target') {
    const { column, row } = type === 'source' ? step.from : step.to
    const x = this.column(column).centerX
    const { y } = nonNullable(this.#rows[row])

    return {
      cx: x.value(),
      cy: y.value() + PORT_HEIGHT / 2 + step.offset,
      height: type === 'source' ? 40 : 24,
    }
  }

  getViewBounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const { maxX } = this.#actorsRect
    const lastY = last(this.#rows)?.bottom ?? this.#rowsTop
    return {
      x: 0,
      y: 0,
      width: maxX,
      height: lastY.value(), // Max Y,
    }
  }

  private addActors(actors: DiagramNode[]) {
    let accX = 0
    let prev: ActorBox | undefined = undefined
    for (const actor of actors) {
      const x = this.newVar(accX)
      this.require(x, '>= 0')
      accX += actor.width

      const y = this.newVar(0)
      this.require(y, '>= 0')

      const actorBox: ActorBox = {
        column: this.#columnRects.length,
        actor,
        x,
        y,
        centerX: x.plus(Math.round(actor.width / 2)),
        centerY: y.plus(Math.round(actor.height / 2)),
        width: actor.width,
        height: actor.height,
        right: x.plus(actor.width),
        bottom: y.plus(actor.height),
      }
      this.#actors.set(actor, actorBox)

      this.#columnRects.push({
        actorBox,
        index: this.#columnRects.length,
        min: {
          x,
          y,
        },
        max: {
          x: actorBox.right,
          y: actorBox.bottom,
        },
        centerX: actorBox.centerX,
      })

      if (prev) {
        this.require(prev.right.plus(ACTOR_GAP), '<=', x)
        this.constraint(prev.centerY, '==', actorBox.centerY, kiwi.Strength.strong)
      } else {
        this.require(x, '>= 0')
      }
      prev = actorBox

      this.require(this.#rowsTop, '>=', actorBox.bottom)
    }
  }

  private addStep(step: Step): this {
    const sourceColumn = this.column(step.source)
    const targetColumn = this.column(step.target)

    const [leftColumn, rightColumn] = sourceColumn.index <= targetColumn.index
      ? [sourceColumn, targetColumn]
      : [targetColumn, sourceColumn]

    const minStepWidth = 70 + (step.label?.width ?? 0) + STEP_LABEL_MARGIN * 2

    if (leftColumn !== rightColumn) {
      this.constraint(leftColumn.centerX.plus(minStepWidth), '<=', rightColumn.centerX)
    } else {
      this.constraint(leftColumn.centerX.plus(minStepWidth), '<=', leftColumn.max.x)
    }

    let height = Math.max(
      step.label?.height ? step.label.height + STEP_LABEL_MARGIN + PORT_HEIGHT / 2 : 0,
      MIN_ROW_HEIGHT,
    )
    height += step.offset
    // if (step.isSelfLoop) {
    //   height += SELF_LOOP_ADDITIONAL_HEIGHT
    // }

    this.ensureRow(step.from.row, height)
    if (step.isSelfLoop) {
      this.ensureRow(step.to.row, MIN_ROW_HEIGHT)
    }

    return this
  }

  private addParallelRect({
    parallelPrefix,
    min,
    max,
  }: ParallelRect) {
    const x1 = this.column(min.column).centerX.minus(24)
    const x2 = this.column(max.column).centerX.plus(24)
    const firstRow = this.#rows[min.row]
    const lastRow = this.#rows[max.row]
    invariant(firstRow && lastRow, `parallel box invalid x1${x1} x2${x2} y1${firstRow} y2${lastRow}`)

    const y1 = firstRow.y.minus(32)
    const y2 = lastRow.y.plus(lastRow.height)

    // margin top
    const prevRow = min.row > 0 && this.#rows[min.row - 1]
    if (prevRow) {
      this.require(y1, '>=', prevRow.y.plus(prevRow.height).plus(16))
    }

    // margin bottom
    const nextRow = max.row < this.#rows.length - 1 ? this.#rows[max.row + 1] : undefined
    if (nextRow) {
      this.require(nextRow.y, '>=', y2.plus(32))
    }

    this.#parallelBoxes.push({
      parallelPrefix,
      x1,
      y1,
      x2,
      y2,
    })
  }

  private addCompound(compound: Compound): NonEmptyArray<CompoundRect> {
    const PADDING = 32
    const PADDING_TOP = 52

    const children = [] as CompoundRect[]
    const nested = compound.nested.flatMap(c => {
      const result = this.addCompound(c)
      // first is the direct child
      children.push(result[0])
      return result
    })
    const depth = Math.max(...nested.map(c => c.depth + 1), 0)

    const from = this.column(compound.from)
    const to = this.column(compound.to)

    const x1 = from.min.x.minus(PADDING)
    from.min.x = x1 // change column rect

    const x2 = to.max.x.plus(PADDING)
    to.max.x = x2 // change column rect

    let y1, y2
    if (to === from) {
      y1 = from.min.y.minus(PADDING_TOP)
      from.min.y = y1 // change column rect
      from.max.y = from.max.y.plus(PADDING) // change column rect

      y2 = this.newVar(0)
      this.require(y2, '>=', from.max.y)
    } else {
      const minY = this.newVar(0)
      this.constraint(minY, '>= 0', kiwi.Strength.weak)
      const maxY = this.newVar(0)
      for (var col = from.index; col <= to.index; col++) {
        const colRect = this.column(col)
        this.constraint(minY, '<=', colRect.min.y.minus(PADDING_TOP), kiwi.Strength.required)
        this.constraint(maxY, '>=', colRect.max.y.plus(PADDING), kiwi.Strength.required)
        colRect.min.y = minY
        colRect.max.y = maxY
      }
      y1 = minY
      y2 = this.newVar(0)
      this.require(y2, '>=', maxY)
    }

    children.forEach(child => {
      this.require(y2, '>=', child.y2.plus(PADDING))
    })

    return [
      {
        node: compound.node,
        depth,
        x1,
        y1,
        x2,
        y2,
      },
      ...nested,
    ]
  }

  private ensureRow(row: number, rowHeight: number) {
    while (row >= this.#rows.length) {
      const prevRowY = this.#rows.length > 0 && this.#rows[this.#rows.length - 1]?.bottom ||
        this.#rowsTop.plus(FIRST_STEP_OFFSET)

      const y = this.newVar(prevRowY.value())
      this.require(y, '>=', prevRowY)

      const height = this.newVar(MIN_ROW_HEIGHT)
      this.require(height, '>=', MIN_ROW_HEIGHT)

      this.#rows.push({
        y,
        height,
        bottom: y.plus(height),
        lastHeight: MIN_ROW_HEIGHT,
      })
    }
    const rowVar = nonNullable(this.#rows[row])
    if (rowHeight > rowVar.lastHeight) {
      rowVar.lastHeight = rowHeight
      this.require(rowVar.height, '>=', rowHeight)
      this.#solver.suggestValue(rowVar.height, rowHeight)
    }
  }

  private newVar(initialValue?: number) {
    const v = new kiwi.Variable()
    this.#solver.addEditVariable(v, kiwi.Strength.medium)
    initialValue && this.#solver.suggestValue(v, initialValue)
    return v
  }

  /**
   * Adds a required constraint:
   * Also adds a weak constraint == if the operator is <= or >=
   */
  private require(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
    right: kiwi.Expression | kiwi.Variable | number | undefined = undefined,
  ) {
    this.constraint(left, op, right, kiwi.Strength.required)
    switch (op) {
      case '<=':
      case '>=':
        this.constraint(left, '==', right, kiwi.Strength.weak)
        break
      case '<= 0':
      case '>= 0':
        this.constraint(left, '== 0', undefined, kiwi.Strength.weak)
        break
    }
  }

  /**
   * Adds a constraint with medium strength by default
   */
  private constraint(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
    right: kiwi.Expression | kiwi.Variable | number | undefined = undefined,
    strength = kiwi.Strength.medium,
  ) {
    let operator: kiwi.Operator
    switch (op) {
      case '==':
        operator = kiwi.Operator.Eq
        break
      case '>=':
        operator = kiwi.Operator.Ge
        break
      case '<=':
        operator = kiwi.Operator.Le
        break
      case '== 0': {
        operator = kiwi.Operator.Eq
        right = 0
        break
      }
      case '>= 0': {
        operator = kiwi.Operator.Ge
        right = 0
        break
      }
      case '<= 0': {
        operator = kiwi.Operator.Le
        right = 0
        break
      }
      default:
        nonexhaustive(op)
    }
    this.#solver.addConstraint(new kiwi.Constraint(left, operator, right ?? 0, strength))
  }

  private recalcActorsRect() {
    this.#actorsRect = this.#columnRects.reduce((acc, rect, index, all) => {
      if (index === 0) {
        acc.minX = rect.min.x.value()
      }
      if (index === all.length - 1) {
        acc.maxX = rect.max.x.value()
      }
      acc.minY = Math.min(acc.minY, rect.min.y.value())
      acc.maxY = Math.max(acc.maxY, rect.max.y.value())
      return acc
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    })
  }
}
