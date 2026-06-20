import {
  type BBox,
  type DiagramNode,
  type DynamicViewFlow,
  type DynamicViewFlowOps,
  type NonEmptyArray,
  flowAncestors,
  hasProp,
  StepPath,
} from '@likec4/core/types'
import { invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { defu } from 'defu'
import {
  filter,
  hasAtLeast,
  last,
  map,
  only,
} from 'remeda'
import type { Compound, Paddings, Rect, Step } from './_types'
import {
  ACTOR_GAP,
  COLUMN_GAP,
  FIRST_STEP_OFFSET,
  MIN_ROW_HEIGHT,
  PORT_HEIGHT,
  STEP_LABEL_MARGIN,
  SUBFLOW_PADDING,
} from './const'
import { normalizePaddings, rectFromSteps } from './utils'

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

interface Bounding {
  // Top-left
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
  // Bottom-right
  x2: kiwi.Expression | kiwi.Variable
  y2: kiwi.Expression | kiwi.Variable
}

interface CompoundRect extends Bounding {
  node: DiagramNode
  from: ActorBox
  to: ActorBox
  depth: number
  // bottowRow
  bottom: kiwi.Variable
}

interface ActorBox {
  readonly column: number // The column index of the actor box
  readonly actor: DiagramNode
  // The X and Y position of the actor node
  readonly x: kiwi.Variable
  readonly y: kiwi.Variable
  readonly width: number
  readonly height: number
  // Derived properties
  readonly centerX: kiwi.Expression
  readonly centerY: kiwi.Expression
  readonly right: kiwi.Expression
  readonly bottom: kiwi.Expression
  /**
   * The offset of the actor box
   * This is updated if actor box is inside a compound
   */
  readonly offset: {
    top: kiwi.Expression | kiwi.Variable
    left: kiwi.Expression | kiwi.Variable
    right: kiwi.Expression | kiwi.Variable
    bottom: kiwi.Expression | kiwi.Variable
  }
  /**
   * The minimum and maximum row of the steps assigned to this actor box
   */
  minRow: number
  maxRow: number
}

export class SequenceViewLayouter {
  #flow: DynamicViewFlowOps

  #solver = new kiwi.Solver()

  #actors: NonEmptyArray<ActorBox>

  #compounds = [] as Array<CompoundRect>

  #viewportRight: kiwi.Variable
  #viewportBottom: kiwi.Variable
  #rowsTop: kiwi.Variable
  #rows = [] as Array<{
    marginTop: kiwi.Variable
    y: kiwi.Variable | kiwi.Expression
    height: kiwi.Variable
    bottom: kiwi.Expression
    lastHeight: number
  }>

  #subflows = new Map<StepPath, Bounding>()

  constructor({
    actors,
    steps,
    compounds,
    flow,
  }: {
    actors: NonEmptyArray<DiagramNode>
    steps: Array<Step>
    compounds: Array<Compound>
    flow: DynamicViewFlowOps
  }) {
    this.#flow = flow
    this.#rowsTop = this.newVar(FIRST_STEP_OFFSET)
    this.#viewportRight = this.newVar(0)
    this.#viewportBottom = this.newVar(0)

    this.#actors = this.addActors(actors)

    for (const compound of compounds) {
      const result = this.addCompound(compound)
      const toplevel = result[0]
      // ensure that the top level compound is at the top
      this.constraint(toplevel.y1, '==', 0, kiwi.Strength.strong)
      this.put(this.#viewportBottom).after(toplevel.bottom)
      this.put(this.#rowsTop).after(toplevel.y2)
      this.#compounds.push(...result)
    }

    for (const step of steps) {
      this.addStep(step)
    }

    this.createSubflowAreas(steps)

    const firstActor = this.#actors[0]
    this.constraint(firstActor.offset.left, '==', 0, kiwi.Strength.strong)

    const lastActor = this.#actors.reduce((prev, actor) => {
      this.put(actor.x).after(prev.right, ACTOR_GAP)
      this.put(actor.offset.left, kiwi.Strength.strong).after(prev.offset.right, COLUMN_GAP)
      this.constraint(actor.centerY, '==', prev.centerY, kiwi.Strength.strong)
      this.put(this.#rowsTop).after(actor.offset.bottom)
      return actor
    })

    this.put(this.#viewportRight).after(lastActor.offset.right)
    this.put(this.#viewportBottom).after(last(this.#rows)?.bottom ?? this.#rowsTop)

    if (compounds.length > 0) {
      for (const compound of this.#compounds) {
        const from = compound.from.column
        const to = compound.to.column
        let maxRow = Math.max(compound.from.maxRow, compound.to.maxRow)
        for (let i = from + 1; i < to; i++) {
          const actorBox = this.actorBox(i)
          maxRow = Math.max(maxRow, actorBox.maxRow)
        }
        const lastRow = nonNullable(this.#rows[maxRow], `row ${maxRow} not found`)
        this.put(compound.bottom).after(lastRow.bottom, 16)
        this.put(this.#viewportBottom).after(compound.bottom)
      }
    }

    this.#solver.updateVariables()
  }

  getSubflowAreas(): Array<{ subflow: DynamicViewFlow.AnySubFlow; box: BBox }> {
    return [...this.#subflows.entries()].map(([id, { x1, y1, x2, y2 }]) => ({
      subflow: this.#flow.lookup(id),
      box: {
        x: x1.value(),
        y: y1.value(),
        width: x2.value() - x1.value(),
        height: y2.value() - y1.value(),
      },
    }))
  }

  getActorBox(actor: DiagramNode): BBox {
    const actorBox = this.actorBox(actor)
    return {
      x: actorBox.x.value(),
      y: actorBox.y.value(),
      width: actorBox.width,
      height: actorBox.height,
    }
  }

  getCompoundBoxes(): Array<BBox & { node: DiagramNode; depth: number }> {
    return this.#compounds.map(({ node, depth, x1, y1, x2, bottom }) => ({
      node,
      depth,
      x: x1.value(),
      y: y1.value(),
      width: x2.value() - x1.value(),
      height: bottom.value() - y1.value(),
    }))
  }

  getPortCenter(step: Step, type: 'source' | 'target') {
    const { column, row } = type === 'source' ? step.from : step.to
    const x = this.actorBox(column).centerX
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
    return {
      x: 0,
      y: 0,
      width: this.#viewportRight.value(),
      height: this.#viewportBottom.value(), // Max Y,
    }
  }

  private createSubflowAreas(steps: ReadonlyArray<Step>) {
    const nested = filter(steps, hasProp('parent'))
    if (!hasAtLeast(nested, 1)) {
      return
    }
    // Parents
    const ancestors = new Set<StepPath>()
    for (const step of nested) {
      flowAncestors(step.id).forEach(a => ancestors.add(a))
    }

    const selectSteps = (id: StepPath) => filter(nested, s => s.id.startsWith(id))

    this.#flow.walkthrough({
      // initialData: {
      //   prevStep: null as Step | null,
      // },
      // step: ({ data, step }) => {
      //   data.prevStep = steps.find(s => s.id === step) ?? data.prevStep
      // },
      subflow: {
        'try': ({ subflow, parent, previous }) => {
          const steps = selectSteps(subflow.id)
          if (!hasAtLeast(steps, 1)) {
            return false
          }
          return ({ visited }) => {
            // const { trySteps, catchSteps, finallySteps } = this.#flow.unwindTry({ flow: visited })
            const bbox = this.wrapAroundRect(rectFromSteps(steps))
            this.#subflows.set(subflow.id, bbox)
          }
        },
        'try-block': true,
        'try-catch': true,
        'try-finally': true,
        default: ({ subflow, parent, previous }) => {
          if (!ancestors.has(subflow.id)) {
            return false
          }
          const steps = selectSteps(subflow.id)
          if (!hasAtLeast(steps, 1)) {
            return false
          }
          // Wrap all steps
          const bbox = this.wrapAroundRect(rectFromSteps(steps))
          this.#subflows.set(subflow.id, bbox)

          return true

          // // If we are nested flow, position relative to parent or previous sibling
          // if (parent) {
          //   if (previous && this.#flow.guards.isSubFlow(previous)) {
          //     const prevBbox = this.#subflows.get(previous.id)
          //     if (prevBbox) {
          //       this.put(bbox.y1).after(prevBbox.y2, 16)
          //     }
          //   }
          //   // we are first subflow
          //   else if (!previous) {
          //     const parentBbox = this.#subflows.get(parent.id)
          //     if (parentBbox) {
          //       this.put(parentBbox.y1).before(bbox.y1, 16)
          //     }
          //   }
          // }

          // return ({ visited }) => {
          //   const nested = this.#flow.nested(subflow.id).flatMap(s => this.#subflows.get(s.id) ?? [])
          //   // Fit nested subflows
          //   nested.forEach((n, i, all) => {
          //     this.put(bbox.x1, kiwi.Strength.medium).before(n.x1, 16)
          //     this.put(bbox.x2, kiwi.Strength.medium).after(n.x2, 16)
          //     // Margin bottom
          //     if (i === all.length - 1) {
          //       this.put(bbox.y2).after(n.y2, 16)
          //     }
          //   })
          // }
        },
      },
    })

    // const walk = (subflow: DynamicViewFlow.AnySubFlow): Bounding | null => {
    //   const steps = selectSteps(subflow.id)
    //   if (!hasAtLeast(steps, 1)) {
    //     return null
    //   }
    //   if (subflow._type === 'loop') {
    //     flowHelpers.nested(subflow).map(s => s.)
    //   }

    //   const nested = this.#flow.nested(subflow.id).flatMap(s => walk(s) ?? [])

    //   const bbox = this.wrapAroundRect(rectFromSteps(steps))
    //   this.#subflows.set(subflow.id, bbox)

    //   nested.forEach((n, i, all) => {
    //     if (i == 0) {
    //       this.put(bbox.y1).before(n.y1, 32)
    //     }
    //     this.put(bbox.x1).before(n.x1, 16)
    //     this.put(bbox.x2).after(n.x2, 16)

    //     if (i === all.length - 1) {
    //       this.put(bbox.y2).after(n.y2, 16)
    //     }

    //     if (i > 0) {
    //       let prev = all[i - 1]!
    //       this.put(n.y1).after(prev.y2, 16)
    //     }
    //   })

    //   return bbox
    // }

    // for (const id of toplevel) {
    //   walk(flow.lookup(id))
    // }

    // pipe(
    //   [...ancestors],
    //   map(a => flow.lookup(a)),
    //   sortNaturalByFqn('desc'),
    //   forEach(sub => {
    //     // const steps = sub.flow.flatMap(s => isString(s) ? stepsById[s] ?? [] : [])
    //     const steps = selectSteps(sub.id)
    //     const rect = rectFromSteps(steps)
    //     const bbox = this.addSubflowRect({
    //       ...rect,
    //       subflow: sub,
    //     })

    //     this.#flowOps.nested(sub.id).flatMap(s => this.#subflows.get(s.id) ?? []).forEach(
    //       (n, i, all) => {
    //         this.wrapNested(bbox, n)
    //         if (i > 0) {
    //           let prev = all[i - 1]!
    //           this.put(n.y1).after(prev.y2, 16)
    //         }
    //       },
    //     )
    //   }),
    // )

    // pipe(
    //   nested,
    //   // First we add subflows with steps only
    //   filter(s => !ancestors.has(s.parent)),
    //   groupByProp('parent'),
    //   mapValues((st, parent) => {
    //     return {
    //       id: parent as StepPath,
    //       steps: st,
    //       ...rectFromSteps(st),
    //     }
    //   }),
    //   forEachObj((subflow) => {
    //     this.addSubflowRect(subflow.id, subflow)
    //   }),
    // )
  }

  private actorBox(actor: DiagramNode | string | number): ActorBox {
    if (typeof actor !== 'number') {
      const id = typeof actor === 'string' ? actor : actor.id
      actor = this.#actors.findIndex(a => a.actor.id === id)
      invariant(actor >= 0, `actor ${id} not found`)
    }
    return nonNullable(this.#actors[actor], `actor at index ${actor} not found`)
  }

  private addActors(actors: NonEmptyArray<DiagramNode>): NonEmptyArray<ActorBox> {
    let accX = 0
    return map(actors, (actor, column) => {
      const x = this.newVar(accX)
      accX += actor.width + ACTOR_GAP

      const y = this.newVar(0)

      const actorBox = {
        column,
        actor,
        x,
        y,
        centerX: x.plus(Math.round(actor.width / 2)),
        centerY: y.plus(Math.round(actor.height / 2)),
        width: actor.width,
        height: actor.height,
        right: x.plus(actor.width),
        bottom: y.plus(actor.height),
        minRow: Infinity,
        maxRow: -Infinity,
      }

      // Create variables for offsets
      const top = this.newVar(0),
        left = this.newVar(0),
        right = this.newVar(0),
        bottom = this.newVar(0)

      this.put(top, kiwi.Strength.strong).before(y)
      this.put(left, kiwi.Strength.strong).before(x)
      this.put(right, kiwi.Strength.strong).after(actorBox.right)
      this.put(bottom, kiwi.Strength.strong).after(actorBox.bottom)

      return {
        ...actorBox,
        offset: {
          top,
          left,
          right,
          bottom,
        },
      }
    })
  }

  private addStep(step: Step): this {
    const source = this.actorBox(step.source)
    const target = this.actorBox(step.target)

    source.minRow = Math.min(source.minRow, step.from.row)
    source.maxRow = Math.max(source.maxRow, step.from.row)

    target.minRow = Math.min(target.minRow, step.to.row)
    target.maxRow = Math.max(target.maxRow, step.to.row)

    const [left, right] = source.column <= target.column
      ? [source, target]
      : [target, source]

    const width = (step.label?.width ?? 100) + STEP_LABEL_MARGIN

    if (left !== right) {
      this.constraint(left.centerX.plus(width), '<=', right.centerX)
    } else {
      this.constraint(left.centerX.plus(width), '<=', left.offset.right)
    }

    let height = step.label?.height ? step.label.height + STEP_LABEL_MARGIN + PORT_HEIGHT / 2 : MIN_ROW_HEIGHT
    height = Math.max(height, MIN_ROW_HEIGHT) + step.offset

    this.ensureRow(step.from.row, height)
    if (step.isSelfLoop) {
      this.ensureRow(step.to.row, MIN_ROW_HEIGHT)
    }

    return this
  }

  private addSubflowRect({
    subflow,
    min,
    max,
  }: Rect & {
    subflow: DynamicViewFlow.AnySubFlow
  }) {
    invariant(!this.#subflows.has(subflow.id))
    const bbox = this.wrapAroundRect({ min, max })
    // const x1 = this.actorBox(min.column).centerX.minus(30)
    // const x2 = this.actorBox(max.column).centerX.plus(30)
    // const firstRow = this.#rows[min.row]
    // const lastRow = this.#rows[max.row]
    // invariant(firstRow && lastRow, `Subflow box invalid minRow=${min.row} maxRow=${max.row}`)

    // const y1 = this.newVar(0)
    // this.put(y1).before(firstRow.y, 40)
    // const y2 = this.newVar(0)
    // this.constraint(y2, '==', lastRow.bottom, kiwi.Strength.medium)

    // // margin top
    // const rowBefore = min.row > 0 && this.#rows[min.row - 1]
    // if (rowBefore) {
    //   this.put(y1).after(rowBefore.bottom, 16)
    // }

    // const rowAfter = max.row < this.#rows.length - 1 && this.#rows[max.row + 1]
    // if (rowAfter) {
    //   this.put(y2).before(rowAfter.y, 16)
    // }
    // this.#flowOps.lookup
    // subflow.flow

    this.#subflows.set(subflow.id, bbox)
    return bbox
    // let parent = parentFlow(subflow.id)
    // let parentArea = parent && this.#subflows.get(parent)
    // if (parentArea) {
    //   // this.put(parentArea.x1).before(x1, 16)
    //   this.put(parentArea.y1).before(y1, 16)
    //   // this.put(parentArea.x2).after(x2, 16)
    //   this.put(parentArea.y2).after(y2, 8)
    // }
  }

  private wrapAroundRect(rect: Rect, paddings?: Paddings) {
    const p = normalizePaddings(
      defu(
        paddings,
        SUBFLOW_PADDING,
      ),
    )
    const bounds = this.getRectBounds(rect)
    const x1 = this.newVar()
    this.put(x1).before(bounds.x1.minus(p.left))
    // if (p.left > 0) {
    //   this.put(x1, kiwi.Strength.medium).after(bounds.x1.minus(p.left))
    // }
    const x2 = this.newVar()
    this.put(x2, kiwi.Strength.strong).after(bounds.x2, p.right)
    // if (p.right > 0) {
    //   this.put(x2, kiwi.Strength.medium).before(bounds.x2.plus(p.right))
    // }

    const y1 = this.newVar()
    this.put(y1).after(bounds.minY)
    this.put(y1).before(bounds.y1.minus(p.top))
    // if (p.top > 0) {
    //   this.put(y1, kiwi.Strength.medium).after(bounds.y1)
    // }
    const y2 = this.newVar()
    this.constraint(y2, '==', bounds.y2, kiwi.Strength.medium)

    // // margin top
    // const rowBefore = min.row > 0 && this.#rows[min.row - 1]
    // if (rowBefore) {
    //   this.require(y1, '>=', rowBefore.bottom)
    // }

    // const rowAfter = max.row < this.#rows.length - 1 && this.#rows[max.row + 1]
    // if (rowAfter) {
    //   this.put(y2).before(rowAfter.y, 24)
    // }

    // this.put(y1).after(bounds.minY, 20)
    // this.put(y1).before(bounds.y1, 20)

    // this.put(y2).after(bounds.y2)
    // this.put(y2).before(bounds.maxY)

    return {
      x1,
      y1,
      x2,
      y2,
    }
  }

  private getRectBounds({ min, max }: Rect) {
    const firstRow = this.#rows[min.row]
    const lastRow = this.#rows[max.row]
    invariant(firstRow && lastRow, `Subflow box invalid minRow=${min.row} maxRow=${max.row}`)

    // // margin top
    const rowBefore = min.row > 0 ? this.#rows[min.row - 1]?.bottom : undefined
    // const rowAfter = max.row < this.#rows.length - 1 ? this.#rows[max.row + 1] : undefined

    return {
      // We need to fit the subflow box to the rows it spans, but with some margin
      minY: rowBefore ?? this.#rowsTop,
      x1: this.actorBox(min.column).centerX,
      y1: firstRow.y,
      x2: this.actorBox(max.column).centerX,
      y2: lastRow.bottom,
      // margin bottom
      // maxY: rowAfter?.y.minus(rowAfter.offsetTop) ?? this.#viewportBottom.minus(10),
    }
  }

  private addCompound(compound: Compound): NonEmptyArray<CompoundRect> {
    const PADDING = 32
    const PADDING_TOP = 40
    const PADDING_TOP_FROM_ACTOR = 52

    const children = [] as CompoundRect[]
    const nested = compound.nested.flatMap(c => {
      const result = this.addCompound(c)
      // first is the direct child
      children.push(result[0])
      return result
    })
    const depth = Math.max(...nested.map(c => c.depth + 1), 0)

    const from = this.actorBox(compound.from)
    const to = this.actorBox(compound.to)

    const x1 = from.offset.left.minus(PADDING)
    from.offset.left = x1 // change offset

    const x2 = to.offset.right.plus(PADDING)
    to.offset.right = x2 // change offset

    const bottom = this.newVar(0)

    const onlyChild = only(children)

    let y1, y2
    switch (true) {
      case !!onlyChild: {
        y1 = onlyChild.y1.minus(PADDING_TOP)
        y2 = onlyChild.y2.plus(PADDING)
        this.put(bottom).after(onlyChild.bottom, PADDING)
        break
      }
      // Compound with single actor
      case to === from: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        this.put(y1).before(from.offset.top, PADDING_TOP_FROM_ACTOR)
        this.put(y2).after(from.offset.bottom, PADDING)
        this.put(bottom).after(y2)
        break
      }
      // Compound nested compound, offset from it
      case children.length > 0: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        for (const child of children) {
          this.put(y1).before(child.y1, PADDING)
          this.put(y2).after(child.y2, PADDING)
          this.put(bottom).after(child.bottom, PADDING)
        }
        break
      }
      default: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        for (var col = from.column; col <= to.column; col++) {
          const offset = this.actorBox(col).offset
          this.put(y1).before(offset.top, PADDING_TOP_FROM_ACTOR)
          this.put(y2).after(offset.bottom, PADDING)
        }
        this.put(bottom).after(y2)
        break
      }
    }

    for (var col = from.column; col <= to.column; col++) {
      const offset = this.actorBox(col).offset
      offset.top = y1
      offset.bottom = y2
    }

    return [
      {
        node: compound.node,
        depth,
        from,
        to,
        x1,
        y1,
        x2,
        y2,
        bottom,
      },
      ...nested,
    ]
  }

  private ensureRow(row: number, rowHeight: number) {
    while (row >= this.#rows.length) {
      const prevRowY = this.#rows.length > 0 && this.#rows[this.#rows.length - 1]?.bottom ||
        this.#rowsTop // .plus(FIRST_STEP_OFFSET)

      const marginTop = this.newVar(0)

      const y = this.newVar(this.#rows.length * MIN_ROW_HEIGHT)
      // this.constraint(y, '>=', prevRowY, kiwi.Strength.weak)
      this.put(y).after(prevRowY.plus(marginTop))

      const height = this.newVar(MIN_ROW_HEIGHT)
      this.require(height, '>=', MIN_ROW_HEIGHT)

      this.#rows.push({
        marginTop,
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
    this.#solver.addEditVariable(v, kiwi.Strength.weak)
    if (typeof initialValue === 'number') {
      this.#solver.suggestValue(v, initialValue)
    }
    this.constraint(v, '>=', 0, kiwi.Strength.strong)
    return v
  }

  /**
   * Adds a required constraint:
   * Also adds a weak constraint == if the operator is <= or >=
   */
  private require(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
    right?: kiwi.Expression | kiwi.Variable | number | undefined,
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

  private put(variable: kiwi.Variable | kiwi.Expression, strength = kiwi.Strength.required) {
    const eqStrength = strength === kiwi.Strength.required ? kiwi.Strength.medium : kiwi.Strength.weak
    return {
      before: (other: kiwi.Variable | kiwi.Expression, gap?: number) => {
        if (gap) {
          other = other.minus(gap)
        }
        this.constraint(variable, '<=', other, strength)
        this.constraint(variable, '==', other, eqStrength)
      },
      after: (other: kiwi.Variable | kiwi.Expression, gap?: number) => {
        if (gap) {
          other = other.plus(gap)
        }
        this.constraint(variable, '>=', other, strength)
        this.constraint(variable, '==', other, eqStrength)
      },
    }
  }

  // private recalcActorsRect() {
  //   this.#actorsRect = this.#columnRects.reduce((acc, rect, index, all) => {
  //     if (index === 0) {
  //       acc.minX = rect.min.x.value()
  //     }
  //     if (index === all.length - 1) {
  //       acc.maxX = rect.max.x.value()
  //     }
  //     acc.minY = Math.min(acc.minY, rect.min.y.value())
  //     acc.maxY = Math.max(acc.maxY, rect.max.y.value())
  //     return acc
  //   }, {
  //     minX: Infinity,
  //     minY: Infinity,
  //     maxX: -Infinity,
  //     maxY: -Infinity,
  //   })
  // }
}
