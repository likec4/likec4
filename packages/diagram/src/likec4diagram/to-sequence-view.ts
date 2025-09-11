import {
  type BBox,
  type DiagramEdge,
  type DiagramNode,
  type EdgeId,
  type LayoutedDynamicView,
  type NodeId,
  type NonEmptyArray,
  getParallelStepsPrefix,
  isStepEdgeId,
  RichText,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { forEach, groupBy, last, mapValues, pipe, values } from 'remeda'
import type { Types } from './types'

type Step = {
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

// space between actors
const ACTOR_MARGIN = 60

// minimum height of a step row
const MIN_ROW_HEIGHT = 80

const PORT_HEIGHT = 32

// margin from step label to step box
const STEP_LABEL_MARGIN = 50

// offset from actor box
const STEPS_OFFSET = 40

// offset for continuing steps
// A -> B,
//      C -> D (sequential)
// A -> B -> C (continuous)
const CONTINUOUS_OFFSET = 22

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

class SequenceViewLayout {
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
      this.addActorBox(actor)
    }
    for (const step of steps) {
      this.addStep(step)
    }

    pipe(
      steps,
      groupBy(s => s.parallelPrefix ?? undefined),
      mapValues((parallelSteps, parallelPrefix) => {
        return parallelSteps.reduce(
          (acc, step) => {
            acc.minColumn = Math.min(acc.minColumn, step.from.column, step.to.column)
            acc.maxColumn = Math.max(acc.maxColumn, step.from.column, step.to.column)
            acc.minRow = Math.min(acc.minRow, step.from.row, step.to.row)
            acc.maxRow = Math.max(acc.maxRow, step.from.row, step.to.row)
            return acc
          },
          {
            parallelPrefix,
            minColumn: Infinity,
            maxColumn: -Infinity,
            minRow: Infinity,
            maxRow: -Infinity,
          },
        )
      }),
      values(),
      forEach(parallelBox => {
        this.addParallelBox(parallelBox)
      }),
    )
    this.resolve()
  }

  private addActorBox(actor: DiagramNode): this {
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
      this.require(x, '>=', prevRight)

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
    } else if (leftColumn < this.#columnsX.length - 1) {
      const right = this.#columnsX[leftColumn + 1]
      invariant(right, 'right column not found')

      this.constraint(left.plus(minStepWidth), '<=', right)
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

  private addParallelBox({
    parallelPrefix,
    minColumn,
    maxColumn,
    minRow,
    maxRow,
  }: {
    parallelPrefix: string
    minColumn: number
    maxColumn: number
    minRow: number
    maxRow: number
  }) {
    const x1 = this.#columnsX[minColumn]?.minus(24)
    const x2 = this.#columnsX[maxColumn]?.plus(24)
    const firstRow = this.#rows[minRow]
    const lastRow = this.#rows[maxRow]
    invariant(x1 && x2 && firstRow && lastRow, `parallel box invalid x1${x1} x2${x2} y1${firstRow} y2${lastRow}`)

    const y1 = firstRow.y.minus(32)
    const y2 = lastRow.y.plus(lastRow.height)

    const prevRow = this.#rows[minRow - 1]
    if (prevRow) {
      this.require(y1, '>=', prevRow.y.plus(prevRow.height).plus(16))
    }
    const nextRow = this.#rows[maxRow + 1]
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

  get parallelBoxes(): Array<BBox & { parallelPrefix: string }> {
    return this.#parallelBoxes.map(({ parallelPrefix, x1, y1, x2, y2 }) => ({
      parallelPrefix,
      x: x1.value(),
      y: y1.value(),
      width: x2.value() - x1.value(),
      height: y2.value() - y1.value(),
    }))
  }

  resolve(): this {
    this.#solver.updateVariables()
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
    return this
  }

  getActorBox(actor: DiagramNode) {
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

  // get actorsMaxXY(): {
  //   minX: number
  //   minY: number
  //   maxX: number
  //   maxY: number
  // } {
  //   return this.#actorsRec
  // }

  get bounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const { maxX, maxY } = this.#actorsRect
    const lastRow = last(this.#rows)
    return {
      x: 0,
      y: 0,
      width: maxX,
      height: lastRow.y.value() + lastRow.height.value(), // Max Y,
    }
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
}

export function toSequenceView(dynamicView: LayoutedDynamicView): {
  bounds: BBox
  xynodes: Array<Types.SequenceActorNode | Types.SequenceParallelArea>
  xyedges: Array<Types.SequenceStepEdge>
} {
  const actors = [] as Array<DiagramNode>
  const actorPorts = new DefaultMap<
    DiagramNode,
    Array<{
      step: Step
      row: number
      type: 'source' | 'target'
      position: 'left' | 'right' | 'top' | 'bottom'
    }>
  >(() => [])

  const steps = [] as Array<Step>

  // const stepActions = [] as Array<null | { label: string; height: number; width: number }>

  const getNode = (id: string) => nonNullable(dynamicView.nodes.find(n => n.id === id))

  const addActor = (...[source, target]: [DiagramNode, DiagramNode]) => {
    // source actor not yet added
    if (!actors.includes(source)) {
      const indexOfTarget = actors.indexOf(target)
      if (indexOfTarget > 0) {
        actors.splice(indexOfTarget, 0, source)
      } else {
        actors.push(source)
      }
    }
    if (!actors.includes(target)) {
      actors.push(target)
    }
  }

  let row = 0
  let prevStep: Step | null = null

  for (const edge of dynamicView.edges.filter(e => isStepEdgeId(e.id))) {
    const source = getNode(edge.source)
    let sourceColumn = actors.indexOf(source)
    const target = getNode(edge.target)
    let targetColumn = actors.indexOf(target)

    const alreadyAdded = sourceColumn >= 0 && targetColumn >= 0

    if (!alreadyAdded) {
      if (edge.dir === 'back') {
        addActor(target, source)
      } else {
        addActor(source, target)
      }
      sourceColumn = actors.indexOf(source)
      targetColumn = actors.indexOf(target)
    }

    const isSelfLoop = source === target
    const isBack = sourceColumn > targetColumn
    const parallelPrefix = getParallelStepsPrefix(edge.id)

    let isContinuing = false
    if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
      isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack
    }

    if (!isContinuing) {
      row++
    }

    const step: Step = {
      id: edge.id,
      from: {
        column: sourceColumn,
        row,
      },
      to: {
        column: targetColumn,
        row: isSelfLoop ? ++row : row,
      },
      edge,
      isSelfLoop,
      isBack,
      parallelPrefix,
      offset: isContinuing ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET : 0,
      source,
      target,
      label: edge.labelBBox
        ? {
          height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
          width: edge.labelBBox.width + 16,
          text: edge.label,
        }
        : null,
    }
    prevStep = step
    steps.push(step)

    actorPorts.get(source).push({ step, row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' })
    actorPorts.get(target).push({ step, row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' })
  }

  const layout = new SequenceViewLayout({
    actors,
    steps,
  }).resolve()

  const bounds = layout.bounds

  const parallelBoxes = layout.parallelBoxes.map(({
    x,
    y,
    width,
    height,
    parallelPrefix,
  }): Types.SequenceParallelArea => {
    const id = `seq-parallel-${parallelPrefix}` as NodeId
    return {
      id,
      type: 'seq-parallel',
      data: {
        id,
        title: 'PARALLEL',
        technology: null,
        color: 'gray',
        shape: 'rectangle',
        style: {},
        tags: [],
        position: [x, y],
        level: 0,
        icon: null,
        width,
        height,
        description: RichText.EMPTY,
        viewId: dynamicView.id,
        parallelPrefix,
      },
      zIndex: 1,
      position: {
        x,
        y,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      style: {
        pointerEvents: 'none',
      },
      width,
      initialWidth: width,
      height,
      initialHeight: height,
    }
  })

  return {
    bounds,
    xynodes: [
      ...parallelBoxes,
      ...actors.map((actor): Types.SequenceActorNode => {
        const { x, y, width, height } = layout.getActorBox(actor)
        const ports = actorPorts.get(actor)
        return ({
          id: actor.id,
          type: 'seq-actor',
          data: {
            id: actor.id,
            position: [x, y],
            level: 0,
            icon: actor.icon ?? null,
            isMultiple: actor.style.multiple ?? false,
            title: actor.title,
            width,
            height,
            color: actor.color,
            navigateTo: actor.navigateTo ?? null,
            shape: actor.shape,
            style: actor.style,
            tags: actor.tags,
            modelFqn: actor.modelRef ?? null,
            technology: actor.technology,
            description: RichText.from(actor.description),
            viewHeight: bounds.height,
            viewId: dynamicView.id,
            ports: ports.map((p): Types.SequenceActorNodePort => {
              const bbox = layout.getPortCenter(p.step, p.type)
              return ({
                id: p.step.id + '_' + p.type,
                cx: bbox.cx - x,
                cy: bbox.cy - y,
                height: bbox.height,
                type: p.type,
                position: p.position,
              })
            }),
          },
          zIndex: 10,
          position: {
            x,
            y,
          },
          width,
          initialWidth: width,
          height,
          initialHeight: height,
        })
      }),
    ],
    xyedges: steps.map(({ id, edge, ...step }) => ({
      id: id,
      type: 'sequence-step',
      data: {
        id: edge.id,
        label: step.label?.text ?? null,
        technology: edge.technology,
        notes: RichText.from(edge.notes),
        navigateTo: edge.navigateTo,
        controlPoints: edge.controlPoints ?? null,
        labelBBox: {
          x: 0,
          y: 0,
          width: step.label?.width ?? edge.labelBBox?.width ?? 32,
          height: step.label?.height ?? edge.labelBBox?.height ?? 32,
        },
        labelXY: null,
        points: edge.points,
        color: edge.color ?? 'gray',
        line: edge.line ?? 'solid',
        dir: 'forward',
        // dir: edge.dir ?? 'forward',
        head: 'normal',
        tail: 'none',
      },
      zIndex: 20,
      interactionWidth: MIN_ROW_HEIGHT,
      source: step.source.id,
      sourceHandle: id + '_source',
      target: step.target.id,
      targetHandle: id + '_target',
    })),
  }
}
