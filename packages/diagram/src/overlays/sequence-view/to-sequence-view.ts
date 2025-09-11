import {
  type BBox,
  type DiagramEdge,
  type DiagramNode,
  type EdgeId,
  type LayoutedDynamicView,
  isStepEdgeId,
  RichText,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { last, map, pipe, sum, take } from 'remeda'
import type { SequenceViewTypes } from './_types'

type Step = {
  id: EdgeId
  row: number
  columns: {
    from: number
    to: number
  }
  source: DiagramNode
  target: DiagramNode
  label: null | {
    height: number
    width: number
    text: string
  }
  isBack: boolean
  edge: DiagramEdge
}

// space between actors
const ACTOR_MARGIN = 100

// minimum height of a step row
const MIN_STEP_HEIGHT = 60

// margin from step label to step box
const STEP_LABEL_MARGIN = 32

// offset from actor box
const STEPS_OFFSET = 60

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
  #rowHeights = [] as Array<kiwi.Variable>

  constructor({
    actors,
    steps,
  }: {
    actors: Array<DiagramNode>
    steps: Array<Step>
  }) {
    for (const actor of actors) {
      this.addActorBox(actor)
    }
    for (const step of steps) {
      this.addStep(step)
    }
  }

  addActorBox(actor: DiagramNode): this {
    const prev = last(this.#actors)

    const x = new kiwi.Variable()
    const y = new kiwi.Variable()
    this.#solver.addEditVariable(x, kiwi.Strength.weak)
    this.#solver.addEditVariable(y, kiwi.Strength.weak)
    this.#solver.suggestValue(x, this.#actors.length * 200)
    this.#solver.suggestValue(y, 0)

    if (!prev) {
      this.require(x, '>= 0')
      this.require(y, '>= 0')
    }

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
    return this
  }

  addStep(step: Step): this {
    const left = this.#columnsX[Math.min(step.columns.from, step.columns.to)]
    invariant(left, 'left column not found')
    const right = this.#columnsX[Math.max(step.columns.from, step.columns.to)]
    invariant(right, 'right column not found')

    this.ensureRow(step.row, step.label?.height)

    // left + minStepWidth <= right
    const minStepWidth = 100 + (step.label?.width ?? 0)
    this.require(left.plus(minStepWidth), '<=', right)
    return this
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

  getCellBox(column: number, row: number): BBox {
    const actor = nonNullable(this.#actors[column])
    const y = this.#actorsRect.maxY + STEPS_OFFSET + pipe(
      this.#rowHeights,
      take(row),
      map(r => r.value()),
      sum(),
    )
    return {
      x: actor.x.value(),
      y,
      width: actor.width,
      height: nonNullable(this.#rowHeights[row]).value(),
    }
  }

  get rowHeights(): readonly number[] {
    return this.#rowHeights.map(rowHeight => rowHeight.value())
  }

  // get actorsMaxXY(): {
  //   minX: number
  //   minY: number
  //   maxX: number
  //   maxY: number
  // } {
  //   return this.#actorsRect
  // }

  get bounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const { maxX, maxY } = this.#actorsRect
    return {
      x: 0,
      y: 0,
      width: maxX,
      height: maxY + STEPS_OFFSET + sum(this.rowHeights),
    }
  }

  private ensureRow(row: number, height?: number | undefined) {
    while (row >= this.#rowHeights.length) {
      const rowHeightVar = new kiwi.Variable()
      this.#solver.addEditVariable(rowHeightVar, kiwi.Strength.weak)

      // ensure rowHeight is at least MIN_STEP_HEIGHT
      const heightMinusMargin = new kiwi.Expression(rowHeightVar, MIN_STEP_HEIGHT)

      this.require(heightMinusMargin, '>= 0')
      this.constraint(heightMinusMargin, '== 0')
      this.#solver.suggestValue(rowHeightVar, MIN_STEP_HEIGHT)
      this.#rowHeights.push(rowHeightVar)
    }
    const rowHeightVar = nonNullable(this.#rowHeights[row])
    height = height ? height + STEP_LABEL_MARGIN * 2 : MIN_STEP_HEIGHT

    if (height > rowHeightVar.value()) {
      const minusMargin = rowHeightVar.minus(height)
      this.require(minusMargin, '>= 0')
      this.constraint(minusMargin, '== 0')
      this.#solver.suggestValue(rowHeightVar, height)
    }
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
  xynodes: Array<SequenceViewTypes.Node>
  xyedges: Array<SequenceViewTypes.Edge>
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
    const isBack = edge.dir === 'back'
    const source = getNode(edge.source)
    const target = getNode(edge.target)
    if (isBack) {
      addActor(target, source)
    } else {
      addActor(source, target)
    }

    if (prevStep && (prevStep.target !== source || prevStep.isBack !== isBack)) {
      row++
    }

    const step: Step = {
      id: edge.id,
      row,
      edge,
      isBack,
      columns: {
        from: actors.indexOf(source),
        to: actors.indexOf(target),
      },
      source,
      target,
      label: edge.labelBBox && edge.label
        ? {
          height: edge.labelBBox.height + 16,
          width: edge.labelBBox.width + 16,
          text: edge.label,
        }
        : null,
    }
    prevStep = step
    steps.push(step)

    actorPorts.get(source).push({ step, row, type: 'source', position: isBack ? 'left' : 'right' })
    actorPorts.get(target).push({ step, row, type: 'target', position: isBack ? 'right' : 'left' })
  }

  const layout = new SequenceViewLayout({
    actors,
    steps,
  }).resolve()

  const bounds = layout.bounds

  return {
    xynodes: actors.map((actor, column) => {
      const { x, y, width, height } = layout.getActorBox(actor)
      const ports = actorPorts.get(actor)
      return ({
        id: actor.id,
        type: 'actor',
        data: {
          title: actor.title,
          width,
          height,
          color: actor.color,
          navigateTo: actor.navigateTo,
          shape: actor.shape,
          style: actor.style,
          tags: actor.tags,
          modelRef: actor.modelRef,
          technology: actor.technology,
          description: RichText.from(actor.description),
          viewNode: actor,
          ports: ports.map((p): SequenceViewTypes.Port => {
            const bbox = layout.getCellBox(column, p.row)
            return ({
              id: p.step.id,
              x: bbox.x - x,
              y: bbox.y - y,
              width: bbox.width,
              height: bbox.height,
              type: p.type,
              position: p.position,
            })
          }),
          // ports: {
          //   in: ports.in.map(p => {
          //     const bbox = layout.getCellBox(column, p.row)
          //     return ({
          //       step: p.step.id,
          //       ...bbox,
          //       x: bbox.x - x,
          //       y: bbox.y - y,
          //     })
          //   }),
          //   out: ports.out.map(p => {
          //     const bbox = layout.getCellBox(column, p.row)
          //     return ({
          //       step: p.step.id,
          //       ...bbox,
          //       x: bbox.x - x,
          //       y: bbox.y - y,
          //     })
          //   }),
          // },
          verticalLineHeight: bounds.height - y,
        },
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
    xyedges: steps.map(({ id, edge, ...step }) => ({
      id: id,
      type: 'step',
      data: {
        id: id,
        label: step.label?.text ?? null,
        color: edge.color,
        labelBBox: edge.labelBBox,
        head: 'open',
        description: RichText.from(edge.description),
        notes: RichText.from(edge.notes),
        technology: edge.technology,
        line: edge.line,
        navigateTo: edge.navigateTo,
        tail: undefined,
        dir: undefined,
      },
      source: step.source.id,
      sourceHandle: id,
      target: step.target.id,
      targetHandle: id,
    })),
  }
}
