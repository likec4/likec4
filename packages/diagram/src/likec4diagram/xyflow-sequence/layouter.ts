import {
  type BBox,
  type DiagramNode,
  type DynamicViewFlow,
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
import { type NormalizedSpacing, normalizeSpacing, rectFromSteps } from './utils'

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

export interface BBoxVars {
  // Top-left
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
  // Bottom-right
  x2: kiwi.Expression | kiwi.Variable
  y2: kiwi.Expression | kiwi.Variable
}

interface CompoundArea extends BBoxVars {
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

interface SubflowArea extends BBoxVars, Rect {
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
}

export const Strength = {
  required: kiwi.Strength.required,
  strong: kiwi.Strength.strong,
  medium: kiwi.Strength.medium,
  soft: kiwi.Strength.create(0, 0.8, 1.0),
  weak: kiwi.Strength.weak,
}

export class SequenceViewLayouter {
  #flow: DynamicViewFlow

  #solver = new kiwi.Solver()

  #actors: NonEmptyArray<ActorBox>

  #compounds = [] as Array<CompoundArea>

  #viewportRight: kiwi.Variable
  #viewportBottom: kiwi.Variable
  #rowsTop: kiwi.Variable
  /**
   * Each row has inner and outer bounds
   * For adjacent rows, outer-bottom equals outer-top of the next row
   *
   * Inner bounds (top and bottom) are updated during layouting (when wrapped with subflow)
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
    readonly height: kiwi.Variable
    readonly inner: {
      top: kiwi.Variable | kiwi.Expression
      bottom: kiwi.Variable | kiwi.Expression
    }
    readonly rowTop: kiwi.Variable
    readonly outer: {
      readonly top: kiwi.Variable
      readonly bottom: kiwi.Variable
    }
    collapsed?: boolean
  }>

  #subflows = new Map<StepPath, SubflowArea>()

  constructor({
    actors,
    steps,
    compounds,
    flow,
    collapsedFlows,
  }: {
    actors: NonEmptyArray<DiagramNode>
    steps: Array<Step>
    compounds: Array<Compound>
    flow: DynamicViewFlow
    collapsedFlows: StepPath[]
  }) {
    // Increase max iterations to handle complex layouts with many constraints
    // Default is 1000
    this.#solver.maxIterations = 2000

    this.#flow = flow
    const firstRowOffset = Math.max(...actors.map(actor => actor.height)) + FIRST_STEP_OFFSET
    this.#rowsTop = this.newVar(firstRowOffset)
    this.constraint(this.#rowsTop, '==', firstRowOffset, Strength.soft)
    this.constraint(this.#rowsTop, '>=', firstRowOffset, Strength.weak)

    this.#viewportRight = this.newVar(0)
    this.#viewportBottom = this.newVar(0)

    this.#actors = this.addActors(actors)

    for (const compound of compounds) {
      const result = this.addCompound(compound) // first element is the top level compound
      const toplevel = result[0]
      // ensure that the top level compound is at the top
      this.constraint(toplevel.y1, '==', 0, Strength.strong)
      this.put(this.#rowsTop, Strength.strong).after(toplevel.y2)
      this.#compounds.push(...result)
    }

    const [firstActor, ...restActors] = this.#actors
    this.constraint(firstActor.offset.left, '==', 0, Strength.strong)

    const lastActor = restActors.reduce((prev, actor) => {
      this.put(actor.x).after(prev.right, ACTOR_GAP)
      this.put(prev.offset.right, Strength.strong).before(actor.offset.left, COLUMN_GAP)
      this.constraint(actor.centerY, '==', prev.centerY, Strength.strong)
      return actor
    }, firstActor)

    for (const step of steps) {
      this.addStep(step)
    }
    this.createSubflowAreas(steps, new Set(collapsedFlows))

    this.constraint(this.#viewportRight, '==', lastActor.offset.right)
    const mostBottom = last(this.#rows)?.inner.bottom ?? this.#rowsTop
    this.put(this.#viewportBottom, Strength.strong).after(mostBottom, 16)

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
        this.put(compound.bottom, Strength.strong).after(lastRow.inner.bottom, 10)
      }
    }

    this.#solver.updateVariables()
  }

  getSubflowAreas(): Array<{ id: StepPath } & BBox> {
    return [...this.#subflows.entries()].map(([id, { x1, y1, x2, y2 }]) => ({
      id,
      x: x1.value(),
      y: y1.value(),
      width: x2.value() - x1.value(),
      height: y2.value() - y1.value(),
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
    const { rowTop } = nonNullable(this.#rows[row])

    return {
      cx: x.value(),
      cy: rowTop.value() + 40 + step.offset,
      height: type === 'source' ? 40 : 24,
    }
  }

  isStepCollapsed(step: Step) {
    if (step.from.row === step.to.row) {
      return this.#rows[step.from.row]?.collapsed ?? false
    }
    const minRow = Math.min(step.from.row, step.to.row)
    const maxRow = Math.min(step.from.row, step.to.row)
    let collapsed = true
    for (let i = minRow; i <= maxRow; i++) {
      collapsed = collapsed && (this.#rows[i]?.collapsed ?? false)
      if (!collapsed) {
        break
      }
    }
    return collapsed
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
      this.ensureRow(step.to.row, 0)
    }

    return this
  }

  /**
   * Recursively adds a compound and its nested compounds to the layout.
   * Also updates offsets of the actor boxes to accommodate the compound.
   */
  private addCompound(compound: Compound): NonEmptyArray<CompoundArea> {
    const PADDING = 32
    const PADDING_TOP = 40
    const PADDING_TOP_FROM_ACTOR = 52

    const children = [] as CompoundArea[]
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
        this.put(onlyChild.bottom).before(bottom, PADDING)
        break
      }
      // Compound with single actor
      case to === from: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        this.put(y1).before(from.offset.top, PADDING_TOP_FROM_ACTOR)
        this.put(from.offset.bottom).before(y2, PADDING)
        this.put(y2).before(bottom)
        break
      }
      // Compound nested compound, offset from it
      case children.length > 0: {
        y1 = this.newVar(0)
        y2 = this.newVar(0)
        for (const child of children) {
          this.put(y1).before(child.y1, PADDING)
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
          this.put(y1).before(offset.top, PADDING_TOP_FROM_ACTOR)
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
      const prevRowBottom = last(this.#rows)?.outer.bottom || this.#rowsTop
      const outerTop = prevRowBottom

      const innerTop = this.newVar(outerTop.value())
      this.put(innerTop).after(outerTop)

      // If this is the row we are adding, use the provided rowHeight
      let heightValue = rowHeight
      if (row !== this.#rows.length) {
        // Otherwise use MIN_ROW_HEIGHT for existing rows
        heightValue = MIN_ROW_HEIGHT
      }
      const height = new kiwi.Variable()
      height.setValue(heightValue)
      this.#solver.addEditVariable(height, Strength.strong)
      this.#solver.suggestValue(height, heightValue)

      const innerBottom = this.newVar(innerTop.value() + heightValue)
      this.require(innerBottom).after(innerTop)
      this.constraint(
        innerBottom.minus(innerTop),
        '==',
        height,
        Strength.strong,
      )

      const outerBottom = this.newVar(innerBottom.value())
      this.put(outerBottom).after(innerBottom)

      this.#rows.push({
        inner: {
          top: innerTop,
          bottom: innerBottom,
        },
        rowTop: innerTop,
        outer: {
          top: outerTop,
          bottom: outerBottom,
        },
        height,
      })
    }
    const rowVar = nonNullable(this.#rows[row])
    if (rowHeight > rowVar.height.value()) {
      rowVar.height.setValue(rowHeight)
      this.#solver.suggestValue(rowVar.height, rowHeight)
    }
  }

  private collapseRect({ min, max }: Rect) {
    const h = 0
    for (let row = min.row; row <= max.row; row++) {
      const r = nonNullable(this.#rows[row], `Row ${row} not found`)
      r.collapsed = true
      r.height.setValue(h)
      this.#solver.suggestValue(r.height, h)
    }
  }

  private getRectBounds({ min, max }: Rect) {
    const firstRow = this.#rows[min.row]
    const lastRow = this.#rows[max.row]
    invariant(firstRow && lastRow, `Subflow box invalid minRow=${min.row} maxRow=${max.row}`)
    return {
      x1: this.actorBox(min.column).centerX,
      x2: this.actorBox(max.column).centerX,
      get top(): kiwi.Variable | kiwi.Expression {
        return firstRow.inner.top
      },
      set top(value: kiwi.Variable | kiwi.Expression) {
        firstRow.inner.top = value
      },
      get bottom(): kiwi.Variable | kiwi.Expression {
        return lastRow.inner.bottom
      },
      set bottom(value: kiwi.Variable | kiwi.Expression) {
        lastRow.inner.bottom = value
      },
      // We need to fit the subflow box to the rows it spans, but with some margin
      minY: firstRow.outer.top,
      maxY: lastRow.outer.bottom,
    }
  }

  private wrapAroundRect(rect: Rect, spacing?: Spacing): BBoxVars {
    const p = normalizeSpacing(spacing ?? 16)
    const bounds = this.getRectBounds(rect)

    const x1 = this.newVar(0)
    this.put(x1).before(bounds.x1, p.left)
    const x2 = this.newVar(0)
    this.put(x2).after(bounds.x2, p.right)

    const y1 = this.newVar(bounds.minY.value())
    this.require(y1).after(bounds.minY)
    this.put(y1).before(bounds.top, p.top)

    const y2 = this.newVar(bounds.maxY.value())
    this.put(y2).after(bounds.bottom, p.bottom)
    this.require(y2).before(bounds.maxY)

    // Update inner bounds
    bounds.top = y1
    bounds.bottom = y2

    return {
      x1,
      y1,
      x2,
      y2,
    }
  }

  private createSubflowAreas(
    steps: ReadonlyArray<Step>,
    collapsed: Set<StepPath>,
  ) {
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

    const spacing: NormalizedSpacing = {
      top: 30,
      right: 40,
      bottom: 10,
      left: 90,
    }

    /**
     * Expands the parent bounding box to fit all subflows and their nested steps.
     */
    const fitSubflows = ({
      area,
      visited,
      stretch = false,
      padding,
    }: {
      area: SubflowArea
      visited: ReadonlyArray<DynamicViewFlow.AnyStep>
      // if true, stretch subflows to fill the parent bbox
      stretch?: boolean
      padding?: Partial<{
        top: number
        left: number
        right: number
        bottom: number
      }>
    }) => {
      const areas = pipe(
        visited,
        filter(flowGuards.isSubFlow),
        flatMap(b => this.#subflows.get(b.id) ?? []),
      )
      if (!hasAtLeast(areas, 1)) {
        return
      }
      const p = defu(padding, spacing)

      const firstArea = first(areas)
      const lastArea = last(areas)

      // If the first area is at the top of the parent, add top padding
      if (firstArea.min.row == area.min.row) {
        this.require(area.y1).before(firstArea.y1, p.top)
      }

      // If the last area is at the bottom of the parent, add bottom padding
      if (lastArea.max.row == area.max.row) {
        this.require(lastArea.y2).before(area.y2, p.bottom)
      }

      for (const subarea of areas) {
        this.require(subarea.x1).after(area.x1, p.left)
        this.require(subarea.x2).before(area.x2, p.right)
        if (stretch) {
          subarea.x1 = p.left > 0 ? area.x1.plus(p.left) : area.x1
          subarea.x2 = p.right > 0 ? area.x2.minus(p.right) : area.x2
        }
      }
    }

    const createSubflowArea = (
      subflow: DynamicViewFlow.SubFlow.Any,
    ): SubflowArea => {
      const steps = selectSteps(subflow.id)
      const rect = rectFromSteps(steps)
      let space: Spacing
      switch (true) {
        case flowGuards.isAltOrTry(subflow):
          space = 0
          break
        case collapsed.has(subflow.id) && flowGuards.isAltOrTryBranch(subflow):
          space = {
            ...spacing,
            top: 36,
            bottom: 0,
          }
          break
        case collapsed.has(subflow.id):
          space = {
            ...spacing,
            top: 24,
            bottom: 0,
          }
          break
        default:
          space = spacing
          break
      }
      const area = {
        ...this.wrapAroundRect(rect, space),
        ...rect,
      }
      this.#subflows.set(subflow.id, area)
      return area
    }

    this.#flow.walk({
      subflow: ({ subflow, previous, parent }) => ({
        next: collapsed.has(subflow.id) ? [] : subflow.flow,
        onLeave: ({ visited }) => {
          const area = createSubflowArea(subflow)
          const previousSubflow = flowGuards.isSubFlow(previous) && this.#subflows.get(previous.id)

          // Add space between subflows
          if (!flowGuards.isAltOrTryBranch(subflow) && previousSubflow) {
            this.put(previousSubflow.y2).before(area.y1, 32)
          }

          // Ensure space on the left of the subflow to accommodate the previous actor
          if (!parent && area.min.column > 0) {
            this.require(this.actorBox(area.min.column - 1).centerX).before(area.x1, 100)
          }

          switch (true) {
            case collapsed.has(subflow.id): {
              this.collapseRect(area)
              return
            }
            case flowGuards.isAltOrTry(subflow): {
              return fitSubflows({
                area,
                visited,
                padding: {
                  top: 30,
                  left: 0,
                  right: 0,
                },
                stretch: true,
              })
            }
            case flowGuards.isAltOrTryBranch(subflow): {
              return fitSubflows({
                area,
                visited,
                padding: {
                  top: 50,
                  left: 32,
                  bottom: 32,
                  right: 32,
                },
              })
            }
            default: {
              return fitSubflows({
                area,
                visited,
                padding: {
                  top: 40,
                  bottom: 12,
                  left: 32,
                  right: 16,
                },
              })
            }
          }
        },
      }),
    })
  }

  private newVar(initialValue?: number) {
    const v = new kiwi.Variable()
    this.#solver.addEditVariable(v, Strength.weak)
    if (typeof initialValue === 'number') {
      v.setValue(initialValue)
      this.#solver.suggestValue(v, initialValue)
    }
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
