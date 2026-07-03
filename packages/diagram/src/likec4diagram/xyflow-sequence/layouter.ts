import {
  type BBox,
  type DiagramNode,
  type DynamicViewFlow,
  type DynamicViewFlowOps,
  type NonEmptyArray,
  flowAncestors,
  flowGuards,
  hasProp,
  StepPath,
} from '@likec4/core/types'
import { invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import defu from 'defu'
import {
  filter,
  first,
  flatMap,
  hasAtLeast,
  last,
  map,
  only,
  pipe,
} from 'remeda'
import type { Compound, Rect, Spacing, Step } from './_types'
import {
  ACTOR_GAP,
  COLUMN_GAP,
  FIRST_STEP_OFFSET,
  MIN_ROW_HEIGHT,
  PORT_HEIGHT,
  STEP_LABEL_MARGIN,
} from './const'
import { normalizeSpacing, rectFromSteps } from './utils'

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

interface BBoxVars {
  // Top-left
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
  // Bottom-right
  x2: kiwi.Expression | kiwi.Variable
  y2: kiwi.Expression | kiwi.Variable
}

interface CompoundRect extends BBoxVars {
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

const Strength = {
  required: kiwi.Strength.required,
  strong: kiwi.Strength.strong,
  medium: kiwi.Strength.medium,
  soft: kiwi.Strength.create(0, 0.8, 1.0),
  weak: kiwi.Strength.weak,
}

export class SequenceViewLayouter {
  #flow: DynamicViewFlowOps

  #solver = new kiwi.Solver()

  #actors: NonEmptyArray<ActorBox>

  #compounds = [] as Array<CompoundRect>

  #viewportRight: kiwi.Variable
  #viewportBottom: kiwi.Variable
  #rowsTop: kiwi.Variable
  /**
   * Each row has inner and outer bounds
   *
   * ------ outer-top -------
   * [ subflow stack begins ]
   * ------ inner-top -------
   *      [ A ---> B ]
   * ---- inner-bottom ------
   * [ subflow stack ends ]
   * ---- outer-bottom ------
   */
  #rows = [] as Array<{
    height: kiwi.Variable
    topGap: kiwi.Variable
    bottomGap: kiwi.Variable
    // Inner bounds for step
    inner: {
      top: kiwi.Variable | kiwi.Expression
      bottom: kiwi.Expression
    }
    // Outer bounds for subflow stacks around the row
    outer: {
      top: kiwi.Variable | kiwi.Expression
      bottom: kiwi.Variable | kiwi.Expression
    }
    updateGaps: (value: { top?: number; bottom?: number }) => void
  }>

  #subflows = new Map<StepPath, BBoxVars>()

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

    let lastCompound: CompoundRect | undefined
    for (const compound of compounds) {
      const result = this.addCompound(compound)
      // first element is the top level compound
      const toplevel = lastCompound = result[0]
      // ensure that the top level compound is at the top
      this.constraint(toplevel.y1, '==', 0, Strength.strong)
      this.put(this.#viewportBottom, Strength.strong).after(toplevel.bottom)
      this.require(this.#rowsTop).after(toplevel.y2)
      this.#compounds.push(...result)
    }
    if (lastCompound) {
      this.require(this.#viewportRight).after(lastCompound.x2, 16)
    }

    const [firstActor, ...restActors] = this.#actors
    this.constraint(firstActor.offset.left, '==', 0, Strength.strong)
    this.put(this.#rowsTop, Strength.strong).after(firstActor.offset.bottom)

    const lastActor = restActors.reduce((prev, actor) => {
      this.put(actor.x).after(prev.right, ACTOR_GAP)
      this.put(prev.offset.right, Strength.strong).before(actor.offset.left, COLUMN_GAP)
      this.constraint(actor.centerY, '==', prev.centerY, Strength.strong)
      this.require(this.#rowsTop).after(actor.offset.bottom)
      return actor
    }, firstActor)

    for (const step of steps) {
      this.addStep(step)
    }
    this.createSubflowAreas(steps)

    this.require(this.#viewportRight).after(lastActor.offset.right)
    const mostBottom = last(this.#rows)?.outer.bottom ?? this.#rowsTop
    this.put(this.#viewportBottom).after(mostBottom, 16)

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
        this.put(compound.bottom).after(lastRow.outer.bottom)
      }
    }

    this.#solver.updateVariables()
  }

  getSubflowAreas(): Array<{ subflow: DynamicViewFlow.SubFlow.Any; box: BBox }> {
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
    const { inner } = nonNullable(this.#rows[row])

    return {
      cx: x.value(),
      cy: inner.top.value() + 40 + step.offset,
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

    const spacing = {
      padding: {
        top: 30,
        right: 40,
        bottom: 0,
        left: 90,
      },
      margin: 0,
    }

    const spacingTopSubflow = {
      ...spacing,
      margin: 16,
    }

    /**
     * Expands the parent bounding box to fit all subflows and their nested steps.
     */
    const fitSubflows = ({
      parentBbox,
      steps,
      stretch = false,
      padding,
    }: {
      parentBbox: BBoxVars
      steps: ReadonlyArray<DynamicViewFlow.AnyStep>
      // if true, stretch subflows to fill the parent bbox
      stretch?: boolean
      padding?: Partial<{
        top: number
        left: number
        right: number
        bottom: number
      }>
    }) => {
      const boxes = pipe(
        steps,
        filter(flowGuards.isSubFlow),
        flatMap(b => this.#subflows.get(b.id) ?? []),
      )
      if (!hasAtLeast(boxes, 1)) {
        return
      }
      const p = defu(padding, spacing.padding)
      this.require(first(boxes).y1).after(parentBbox.y1, p.top)
      this.require(last(boxes).y2).before(parentBbox.y2, p.bottom)

      const stretchToWidth = stretch ? parentBbox.x2.minus(parentBbox.x1).minus(p.left + p.right) : undefined

      boxes.forEach(box => {
        if (stretchToWidth) {
          this.require(box.x1).after(parentBbox.x1, p.left)
          this.require(box.x2).before(parentBbox.x2, p.right)
          this.constraint(
            stretchToWidth,
            '==',
            box.x2.minus(box.x1),
            Strength.strong,
          )
        } else {
          this.require(box.x1).after(parentBbox.x1, p.left)
          this.require(box.x2).before(parentBbox.x2, p.right)
        }
      })
    }

    const onLeaveExpand =
      (parentBbox: BBoxVars, opts?: Omit<Parameters<typeof fitSubflows>[0], 'parentBbox' | 'steps'>) =>
      ({ visited }: { visited: ReadonlyArray<DynamicViewFlow.AnyStep> }) =>
        fitSubflows({
          parentBbox,
          steps: visited,
          ...opts,
        })

    /**
     * Ensure space on the left of the subflow to accommodate the previous actor
     */
    const constraintOnTheLeft = (bbox: BBoxVars, rect: Rect) => {
      if (rect.min.column > 0) {
        this.require(this.actorBox(rect.min.column - 1).centerX).before(bbox.x1, 100)
      }
    }

    this.#flow.walkthrough({
      subflow: {
        /**
         * Subflows with swimlines (stretch nested subflows)
         */
        ...this.#flow.onSubflows(['alt', 'try'], ({ subflow, previous, parent }) => {
          const steps = selectSteps(subflow.id)
          if (!hasAtLeast(steps, 1)) {
            return false
          }

          const rect = rectFromSteps(steps)
          const bbox = this.wrapAroundRect(rect, !parent ? { margin: 10, padding: 0 } : 0)
          this.#subflows.set(subflow.id, bbox)

          const previousSubflow = !parent && flowGuards.isSubFlow(previous)
            ? this.#subflows.get(previous.id)
            : undefined
          if (previousSubflow) {
            this.constraint(previousSubflow.y2.plus(20), '<=', bbox.y1)
          }
          if (!parent) {
            constraintOnTheLeft(bbox, rect)
          }

          return onLeaveExpand(bbox, {
            padding: {
              top: 20,
              left: 0,
              right: 0,
            },
            stretch: true,
          })
        }),
        /**
         * Subflows as swimlines (have no space between)
         */
        ...this.#flow.onSubflows(
          ['alt-when', 'alt-else', 'alt-if', 'try-block', 'try-catch', 'try-finally'],
          ({ subflow }) => {
            const steps = selectSteps(subflow.id)
            if (!ancestors.has(subflow.id) || !hasAtLeast(steps, 1)) {
              return false
            }
            // Wrap all steps
            const bbox = this.wrapAroundRect(rectFromSteps(steps), { ...spacing, margin: 0 })
            this.#subflows.set(subflow.id, bbox)
            return onLeaveExpand(bbox, {
              padding: {
                top: 50,
                left: 30,
                bottom: 30,
                right: 30,
              },
            })
          },
        ),
        /**
         * Subflows 'opt', 'loop', 'par', 'break'
         */
        default: ({ subflow, parent }) => {
          const steps = selectSteps(subflow.id)
          if (!ancestors.has(subflow.id) || !hasAtLeast(steps, 1)) {
            return false
          }
          invariant(!this.#flow.guards.isAltOrTryBranch(subflow), 'AltOrTryBranch must be handled separately')

          const hasNoSubflows = !this.#flow.hasSubflows(subflow)
          const rect = rectFromSteps(steps)
          const bbox = this.wrapAroundRect(rect, !parent ? spacingTopSubflow : defu({ margin: 10 }, spacing))

          this.#subflows.set(subflow.id, bbox)
          if (!parent) {
            constraintOnTheLeft(bbox, rect)
          }

          return hasNoSubflows || onLeaveExpand(bbox, {
            padding: {
              bottom: 30,
              left: 30,
              right: 30,
            },
          })
        },
      },
    })
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

      this.put(y, Strength.strong).after(top)
      this.put(x, Strength.strong).after(left)
      this.put(actorBox.right, Strength.strong).before(right)
      this.put(actorBox.bottom, Strength.strong).before(bottom)

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

    // Add constraint only if actors are adjacent
    if (Math.abs(target.column - source.column) <= 1) {
      if (left !== right) {
        this.constraint(left.centerX.plus(width), '<=', right.centerX)
      } else {
        this.constraint(left.centerX.plus(width), '<=', left.offset.right)
      }
    }

    let height = step.label?.height ? step.label.height + STEP_LABEL_MARGIN + PORT_HEIGHT : MIN_ROW_HEIGHT
    height = Math.max(height, MIN_ROW_HEIGHT) + step.offset

    this.ensureRow(step.from.row, height)
    if (step.isSelfLoop) {
      this.ensureRow(step.to.row, MIN_ROW_HEIGHT)
    }

    return this
  }

  private wrapAroundRect(rect: Rect, spacing?: Spacing): BBoxVars {
    const { padding: p, margin: m } = normalizeSpacing(spacing ?? 16)
    const bounds = this.getRectBounds(rect)

    const x1 = this.newVar(0)
    this.put(bounds.x1).after(x1, p.left)
    const x2 = this.newVar(0)
    this.put(bounds.x2).before(x2, p.right)

    const y1 = this.newVar(0)
    this.require(y1).after(bounds.minY, m.top)
    this.put(bounds.y1).after(y1, p.top)

    const y2 = this.newVar(0)
    this.put(bounds.y2).before(y2, p.bottom)
    this.require(y2).before(bounds.maxY, m.bottom)

    bounds.updateGaps({
      top: p.top + m.top,
      bottom: p.bottom + m.bottom,
    })

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
    return {
      // We need to fit the subflow box to the rows it spans, but with some margin
      minY: firstRow.outer.top,
      x1: this.actorBox(min.column).centerX,
      y1: firstRow.inner.top,
      x2: this.actorBox(max.column).centerX,
      y2: lastRow.inner.bottom,
      // margin bottom
      maxY: lastRow.outer.bottom,
      updateGaps: ({ top, bottom }: { top?: number; bottom?: number }) => {
        top && firstRow.updateGaps({ top })
        bottom && lastRow.updateGaps({ bottom })
      },
    }
  }

  /**
   * Recursively adds a compound and its nested compounds to the layout.
   * Also updates offsets of the actor boxes to accommodate the compound.
   */
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
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        this.put(onlyChild.y1).after(y1, PADDING_TOP)
        this.put(onlyChild.y2).before(y2, PADDING)
        this.put(onlyChild.bottom).before(bottom, PADDING)
        break
      }
      // Compound with single actor
      case to === from: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        this.put(from.offset.top).after(y1, PADDING_TOP_FROM_ACTOR)
        this.put(from.offset.bottom).before(y2, PADDING)
        this.put(y2).before(bottom)
        break
      }
      // Compound nested compound, offset from it
      case children.length > 0: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        for (const child of children) {
          this.put(child.y1).after(y1, PADDING)
          this.put(child.y2).before(y2, PADDING)
          this.put(child.bottom).before(bottom, PADDING)
        }
        break
      }
      default: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        for (var col = from.column; col <= to.column; col++) {
          const offset = this.actorBox(col).offset
          this.put(offset.top).after(y1, PADDING_TOP_FROM_ACTOR)
          this.put(offset.bottom).before(y2, PADDING)
        }
        this.put(y2).before(bottom)
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
      const prevRowY = last(this.#rows)?.outer.bottom || this.#rowsTop
      const outerTop = prevRowY

      const topGap = this.newVar(0)
      let topGapConstraint = this.require(topGap, '>= 0')

      const bottomGap = this.newVar(0)
      let bottomGapConstraint = this.require(bottomGap, '>= 0')

      const innerTop = this.newVar(0)
      this.require(innerTop).after(outerTop)
      this.put(innerTop, Strength.strong).before(outerTop.plus(topGap))

      // If this is the row we are adding, use the provided rowHeight, otherwise use MIN_ROW_HEIGHT
      const lastHeight = row === this.#rows.length ?
        rowHeight
        : this.#rows.length === 0
        ? 20 // First row
        : MIN_ROW_HEIGHT
      const height = this.newVar(lastHeight)
      this.require(height, '>=', lastHeight)

      const innerBottom = innerTop.plus(height)

      const outerBottom = this.newVar(0)
      this.require(outerBottom).after(innerBottom)
      this.put(outerBottom, Strength.strong).before(innerBottom.plus(topGap))

      this.#rows.push({
        inner: {
          top: innerTop,
          bottom: innerBottom,
        },
        outer: {
          top: outerTop,
          bottom: outerBottom,
        },
        bottomGap,
        topGap,
        height,
        updateGaps: ({ top, bottom }) => {
          if (top && top > topGap.value()) {
            topGap.setValue(top)
            this.#solver.removeConstraint(topGapConstraint)
            this.#solver.suggestValue(topGap, top)
            topGapConstraint = this.require(topGap, '>=', top)
          }
          if (bottom && bottom > bottomGap.value()) {
            bottomGap.setValue(bottom)
            this.#solver.removeConstraint(bottomGapConstraint)
            this.#solver.suggestValue(bottomGap, bottom)
            bottomGapConstraint = this.require(bottomGap, '>=', bottom)
          }
        },
      })
    }
    const rowVar = nonNullable(this.#rows[row])
    if (rowHeight > rowVar.height.value()) {
      rowVar.height.setValue(rowHeight)
      this.#solver.suggestValue(rowVar.height, rowHeight)
      this.require(rowVar.height, '>=', rowHeight)
    }
  }

  private newVar(initialValue?: number) {
    const v = new kiwi.Variable()
    this.#solver.addEditVariable(v, Strength.weak)
    if (typeof initialValue === 'number') {
      v.setValue(initialValue)
      this.#solver.suggestValue(v, initialValue)
    }
    this.constraint(v, '>=', 0, Strength.weak)
    return v
  }

  /**
   * Adds a required constraint:
   * Also adds a weak constraint == if the operator is <= or >=
   */
  private require(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
  ): kiwi.Constraint
  private require(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
    right: kiwi.Expression | kiwi.Variable | number | undefined,
  ): kiwi.Constraint
  private require(left: kiwi.Expression | kiwi.Variable): {
    before: (right: kiwi.Expression | kiwi.Variable, gap?: number) => kiwi.Constraint
    after: (right: kiwi.Expression | kiwi.Variable, gap?: number) => kiwi.Constraint
  }
  private require(
    ...args:
      | [kiwi.Expression | kiwi.Variable]
      | [left: kiwi.Expression | kiwi.Variable, op: Operator]
      | [
        left: kiwi.Expression | kiwi.Variable,
        op: Operator,
        right: kiwi.Expression | kiwi.Variable | number | undefined,
      ]
  ) {
    if (args.length == 1) {
      const [left] = args
      return {
        before: (right: kiwi.Expression | kiwi.Variable, gap: number = 0) => {
          let other = gap ? right.minus(gap) : right
          return this.constraint(left, '<=', other, Strength.required)
        },
        after: (right: kiwi.Expression | kiwi.Variable, gap: number = 0) => {
          let other = gap ? right.plus(gap) : right
          return this.constraint(left, '>=', other, Strength.required)
        },
      }
    }
    const [left, op, right] = args
    const constraint = this.constraint(left, op, right, Strength.required)
    switch (op) {
      case '<=':
      case '>=':
        this.constraint(left, '==', right, Strength.weak)
        break
      case '<= 0':
      case '>= 0':
        this.constraint(left, '== 0', undefined, Strength.weak)
        break
    }
    return constraint
  }

  /**
   * Adds a constraint with medium strength by default
   */
  private constraint(
    left: kiwi.Expression | kiwi.Variable,
    op: Operator,
    right: kiwi.Expression | kiwi.Variable | number | undefined = undefined,
    strength = Strength.medium,
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
    const constraint = new kiwi.Constraint(left, operator, right ?? 0, strength)
    this.#solver.addConstraint(constraint)
    return constraint
  }

  private put(variable: kiwi.Variable | kiwi.Expression, strength = Strength.required) {
    const eqStrength = strength === Strength.required ? Strength.soft : Strength.weak
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
}
