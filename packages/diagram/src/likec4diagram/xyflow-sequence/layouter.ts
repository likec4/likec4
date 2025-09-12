import {
  type BBox,
  type DiagramNode,
  type NonEmptyArray,
} from '@likec4/core/types'
import { invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { last } from 'remeda'
import { type ParallelRect, type Step, findParallelRects } from './_common'
import {
  ACTOR_MARGIN,
  MIN_ROW_HEIGHT,
  PORT_HEIGHT,
  STEP_LABEL_MARGIN,
  STEPS_OFFSET,
} from './const'

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

export class SequenceViewLayouter {
  #solver = new kiwi.Solver()

  #actors = [] as Array<{
    actor: DiagramNode
    x: kiwi.Variable
    y: kiwi.Variable
    centerX: kiwi.Expression
    centerY: kiwi.Expression
    width: number
    height: number
  }>

  #actorsRect = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  }

  /**
   * The X position of each column (vertical line from the center of the actor)
   */
  #columnsX = [] as Array<kiwi.Expression>

  #rows = [{
    y: this.newVar(STEPS_OFFSET),
    height: this.newVar(MIN_ROW_HEIGHT),
    lastHeight: MIN_ROW_HEIGHT,
  }] as NonEmptyArray<{
    y: kiwi.Variable
    height: kiwi.Variable
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
  }: {
    actors: Array<DiagramNode>
    steps: Array<Step>
  }) {
    const [firstRow] = this.#rows

    this.require(firstRow.y, '>=', STEPS_OFFSET)
    this.require(firstRow.height, '>=', MIN_ROW_HEIGHT)

    for (const actor of actors) {
      this.addActor(actor)
    }
    for (const step of steps) {
      this.addStep(step)
    }

    for (const parallelRect of findParallelRects(steps)) {
      this.addParallelRect(parallelRect)
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
    const actorBox = this.#actors.find(a => a.actor.id === actor.id)
    invariant(actorBox, 'actor not found')
    return {
      x: actorBox.x.value(),
      y: actorBox.y.value(),
      width: actorBox.width,
      height: actorBox.height,
    }
  }

  getPortCenter(step: Step, type: 'source' | 'target') {
    const { column, row } = type === 'source' ? step.from : step.to
    const x = nonNullable(this.#columnsX[column])
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
    const lastRow = last(this.#rows)
    return {
      x: 0,
      y: 0,
      width: maxX,
      height: lastRow.y.value() + lastRow.height.value(), // Max Y,
    }
  }

  private addActor(actor: DiagramNode): this {
    const prev = last(this.#actors)

    const x = this.newVar(this.#actors.length * 200)
    const y = this.newVar(0)

    this.require(x, '>= 0')
    this.require(y, '>= 0')

    const centerX = x.plus(Math.round(actor.width / 2))
    const centerY = y.plus(Math.round(actor.height / 2))

    this.#actors.push({
      actor,
      x,
      y,
      centerX,
      centerY,
      width: actor.width,
      height: actor.height,
    })
    this.#columnsX.push(centerX)

    if (prev) {
      const prevRight = new kiwi.Expression(prev.x, prev.width, ACTOR_MARGIN)
      // prev.x + prev.width + MARGIN <= x
      this.require(prevRight, '<=', x)

      // ensure vertical alignment
      this.constraint(prev.centerY, '==', centerY, kiwi.Strength.strong)
    }

    const [firstRow] = this.#rows

    const offsetFromActor = new kiwi.Expression(y, actor.height, STEPS_OFFSET)
    this.constraint(firstRow.y, '>=', offsetFromActor, kiwi.Strength.strong)

    return this
  }

  private addStep(step: Step): this {
    const leftColumn = Math.min(step.from.column, step.to.column)
    const rightColumn = Math.max(step.from.column, step.to.column)

    const left = this.#columnsX[leftColumn]
    invariant(left, 'left column not found')

    const minStepWidth = 70 + (step.label?.width ?? 0) + STEP_LABEL_MARGIN * 2

    if (leftColumn !== rightColumn) {
      const right = this.#columnsX[rightColumn]
      invariant(right, 'right column not found')
      this.constraint(left.plus(minStepWidth), '<=', right)
      // }
      // // if this is the last column, ensure it's not too close to the right edge
      // else if (leftColumn < this.#columnsX.length - 1) {
      //   const right = this.#columnsX[leftColumn + 1]
      //   invariant(right, 'right column not found')

      //   this.constraint(left.plus(minStepWidth), '<=', right)
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
    const x1 = this.#columnsX[min.column]?.minus(24)
    const x2 = this.#columnsX[max.column]?.plus(24)
    const firstRow = this.#rows[min.row]
    const lastRow = this.#rows[max.row]
    invariant(x1 && x2 && firstRow && lastRow, `parallel box invalid x1${x1} x2${x2} y1${firstRow} y2${lastRow}`)

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

  private ensureRow(row: number, rowHeight: number) {
    while (row >= this.#rows.length) {
      const prevRow = this.#rows[this.#rows.length - 1]!

      const y = this.newVar(STEPS_OFFSET + this.#rows.length * MIN_ROW_HEIGHT)
      this.require(y, '>=', prevRow.y.plus(prevRow.height))

      const height = this.newVar(MIN_ROW_HEIGHT)
      this.require(height, '>=', MIN_ROW_HEIGHT)

      this.#rows.push({
        y,
        height,
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
   * Adds a required constraint
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
    this.#actorsRect = this.#actors.reduce((acc, actor) => {
      acc.minX = Math.min(acc.minX, actor.x.value())
      acc.minY = Math.min(acc.minY, actor.y.value())
      acc.maxX = Math.max(acc.maxX, actor.x.value() + actor.width)
      acc.maxY = Math.max(acc.maxY, actor.y.value() + actor.height)
      return acc
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    })
  }
}
