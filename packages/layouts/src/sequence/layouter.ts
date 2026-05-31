import type {
  BBox,
  DiagramNode,
  EdgeId,
  NodeId,
  NonEmptyArray,
} from '@likec4/core/types'
import { invariant, nonexhaustive, nonNullable } from '@likec4/core/utils'
import * as kiwi from '@lume/kiwi'
import { last, map, only } from 'remeda'
import type {
  Compound,
  ParallelRect,
  SequenceActivation,
  SequenceFrame,
  SequenceFrameBranch,
  SequenceNote,
  Step,
} from './_types'
import {
  ACTOR_GAP,
  COLUMN_GAP,
  FIRST_STEP_OFFSET,
  MIN_ROW_HEIGHT,
  PORT_HEIGHT,
  STEP_LABEL_MARGIN,
} from './const'
import { findParallelRects } from './utils'

/**
 * Vertical space reserved per frame header band (kind-badge + condition text).
 * Must exceed the maximum upward extent of step-edge autonumber badges above
 * the first content row so the frame chrome never overlaps the first step arrow.
 * Empirically the badge top sits ~36 graph-units above the row.y; using 48
 * leaves a comfortable 12 graph-unit gap between the badge and the frame chrome.
 *
 * This constant is used both by the Cassowary constraint that pushes the first
 * content row down (finalizeFrameConstraints) and by the BBox computation in
 * getFrameBoxes so the two sides always stay in sync.
 */
const FRAME_HEADER_HEIGHT = 80

// const SELF_LOOP_ADDITIONAL_HEIGHT = 50

type CompareOperator = '<=' | '==' | '>='
type Operator = CompareOperator | `${CompareOperator} 0`

interface CompoundRect {
  node: DiagramNode
  from: ActorBox
  to: ActorBox
  depth: number
  // Top-left
  x1: kiwi.Expression | kiwi.Variable
  y1: kiwi.Expression | kiwi.Variable
  // Bottom-right
  x2: kiwi.Expression | kiwi.Variable
  y2: kiwi.Expression | kiwi.Variable
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
  #solver = new kiwi.Solver()

  #actors: NonEmptyArray<ActorBox>

  #compounds = [] as Array<CompoundRect>

  #viewportRight: kiwi.Variable
  #viewportBottom: kiwi.Variable
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
    y1: kiwi.Expression | kiwi.Variable
    x2: kiwi.Expression
    y2: kiwi.Expression | kiwi.Variable
  }>

  // Frame layout records — populated by addFrame calls AFTER solver.updateVariables()
  #pendingFrames = [] as Array<{
    id: string
    kind: 'if' | 'optional' | 'repeat' | 'parallel' | 'group' | 'critical' | 'break'
    label?: string | undefined
    condition?: string | undefined
    depth: number
    parent?: string | undefined
    minCol: number
    maxCol: number
    branches: Array<{
      label?: string | undefined
      condition?: string | undefined
      rowStart: number
      rowEnd: number
    }>
  }>

  // Activation records — populated externally before getActivations() is called
  #pendingActivations = [] as Array<{
    actor: string
    startStepId: string | null
    endStepId: string | null
    startRow: number | null
    endRow: number | null
    startYOverride: number | null
    endYOverride: number | null
    depth: number
  }>

  // Note records — populated externally before getNotes() is called
  #pendingNotes = [] as Array<{
    id: string
    placement: 'over' | 'left' | 'right'
    actors: ReadonlyArray<string>
    text: string
    afterStepId: string | null
    afterRow: number | null
  }>

  // Step ID → row index reverse map (populated by addStepRow)
  #stepRowMap = new Map<string, number>()

  constructor({
    actors,
    steps,
    compounds,
  }: {
    actors: NonEmptyArray<DiagramNode>
    steps: Array<Step>
    compounds: Array<Compound>
  }) {
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

    for (const parallelRect of findParallelRects(steps)) {
      this.addParallelRect(parallelRect)
    }

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

  /**
   * Register a frame for layout.
   * Must be called AFTER all steps have been added (so #rows is populated).
   * Actual BBox values are resolved lazily in getFrameBoxes().
   */
  registerFrame(frame: {
    id: string
    kind: 'if' | 'optional' | 'repeat' | 'parallel' | 'group' | 'critical' | 'break'
    label?: string | undefined
    condition?: string | undefined
    depth: number
    parent?: string | undefined
    minCol: number
    maxCol: number
    branches: Array<{
      label?: string | undefined
      condition?: string | undefined
      rowStart: number
      rowEnd: number
    }>
  }): void {
    this.#pendingFrames.push(frame)
  }

  /**
   * Register an activation bar for later resolution.
   */
  registerActivation(activation: {
    actor: string
    startStepId: string | null
    endStepId: string | null
    startRow: number | null
    endRow: number | null
    startYOverride: number | null
    endYOverride: number | null
    depth: number
  }): void {
    this.#pendingActivations.push(activation)
  }

  /**
   * Register a note for later resolution.
   */
  registerNote(note: {
    id: string
    placement: 'over' | 'left' | 'right'
    actors: ReadonlyArray<string>
    text: string
    afterStepId: string | null
    afterRow: number | null
  }): void {
    this.#pendingNotes.push(note)
  }

  /**
   * Record the mapping from step edge ID to its row index.
   * Called by sequence-view.ts when building steps.
   */
  recordStepRow(stepId: string, row: number): void {
    this.#stepRowMap.set(stepId, row)
  }

  /**
   * Add solver constraints that push the row AFTER each registered note
   * down by noteHeight + labelOffset + margin so the following step's label
   * does not overlap the note box.
   *
   * Must be called after all registerNote() calls and BEFORE reading any
   * layout values (getFrameBoxes / getActivations / getNotes / getViewBounds).
   * Calls updateVariables() internally to re-solve.
   *
   * @param noteHeight - pixel height of a note box (default 32)
   * @param labelOffset - renderer LABEL_OFFSET for non-self-loop steps (default 16)
   * @param margin - extra clearance beyond labelOffset (default 8)
   */
  finalizeNoteConstraints(noteHeight = 32, labelOffset = 16, margin = 8): void {
    const requiredGap = noteHeight + labelOffset + margin

    for (const note of this.#pendingNotes) {
      if (note.afterRow === null) continue
      const afterRowData = this.#rows[note.afterRow]
      if (!afterRowData) continue

      // The row immediately after the note's afterRow must start at least
      // (noteHeight + labelOffset + margin) below the afterRow's bottom so the
      // following step's label (rendered at nextRow.y + labelOffset) clears the note.
      const nextRow = this.#rows[note.afterRow + 1]
      if (nextRow) {
        this.require(nextRow.y, '>=', afterRowData.bottom.plus(requiredGap))
      }
    }

    this.#solver.updateVariables()
  }

  /**
   * Add solver constraints that push each frame's first content row down by
   * enough space to clear the frame header band(s) stacked above it.
   *
   * For a frame at depth D with N same-row ancestor frames, the total header
   * clearance needed is FRAME_HEADER_HEIGHT * (1 + N).  This ensures none of
   * the stacked badge+condition bands overlap each other or the step arrows
   * in the first content row.
   *
   * Must be called AFTER all registerFrame() calls and BEFORE
   * finalizeNoteConstraints() / reading layout values.
   * Calls updateVariables() internally to re-solve.
   */
  finalizeFrameConstraints(): void {
    // Build per-frame minRow and parent map for same-row ancestor counting
    const frameMinRow = new Map<string, number>()
    for (const f of this.#pendingFrames) {
      const allRows = f.branches.flatMap(b => [b.rowStart, b.rowEnd])
      frameMinRow.set(f.id, Math.min(...allRows))
    }
    const frameById = new Map(this.#pendingFrames.map(f => [f.id, f]))

    // For each frame, compute maxDescendantDepth at same minRow
    // (same logic as getFrameBoxes so the clearance matches the stacking)
    const maxDescSameRowDepth = new Map<string, number>()
    for (const f of this.#pendingFrames) {
      if (!maxDescSameRowDepth.has(f.id)) {
        maxDescSameRowDepth.set(f.id, f.depth)
      }
      const myMinRow = frameMinRow.get(f.id)!
      let parentId = f.parent
      while (parentId) {
        const parent = frameById.get(parentId)
        if (!parent) break
        if (frameMinRow.get(parentId) === myMinRow) {
          const prev = maxDescSameRowDepth.get(parentId) ?? parent.depth
          maxDescSameRowDepth.set(parentId, Math.max(prev, f.depth))
        }
        parentId = parent.parent
      }
    }

    // Group frames by minRow and pick the maximum extraBands value per row.
    // We push the row down by the outermost frame's total header clearance.
    const clearanceByRow = new Map<number, number>()
    for (const f of this.#pendingFrames) {
      const minRow = frameMinRow.get(f.id)!
      const extraBands = (maxDescSameRowDepth.get(f.id) ?? f.depth) - f.depth
      const clearance = FRAME_HEADER_HEIGHT * (1 + extraBands)
      const prev = clearanceByRow.get(minRow) ?? 0
      clearanceByRow.set(minRow, Math.max(prev, clearance))
    }

    // Collect rows that have a note ending just before them (afterRow = minRow - 1).
    // Notes render at afterRow.bottom with height NOTE_HEIGHT; the frame header must
    // clear the note bottom, so we add NOTE_HEIGHT to the clearance for those rows.
    const NOTE_HEIGHT = 32
    const notedRows = new Set<number>()
    for (const note of this.#pendingNotes) {
      if (note.afterRow !== null) {
        notedRows.add(note.afterRow + 1)
      }
    }

    // Add constraints: each frame's first row must start at least `clearance`
    // below the preceding row's bottom, guaranteeing header band(s) fit above.
    // When a note occupies the gap between prevRow and firstRow, add NOTE_HEIGHT
    // so the frame header starts below the note's bottom edge.
    for (const [minRow, clearance] of clearanceByRow) {
      if (minRow === 0) continue // first row has no preceding row
      const prevRow = this.#rows[minRow - 1]
      const firstRow = this.#rows[minRow]
      if (prevRow && firstRow) {
        const noteExtra = notedRows.has(minRow) ? NOTE_HEIGHT : 0
        this.require(firstRow.y, '>=', prevRow.bottom.plus(clearance + noteExtra))
      }
    }

    this.#solver.updateVariables()
  }

  /**
   * Returns the resolved BBox for each registered frame.
   *
   * Depth-based inset: each nesting level adds FRAME_DEPTH_INSET px horizontally
   * so nested frames are visibly inset. Header bands for same-minRow ancestors
   * are stacked vertically so they never overlap each other or the first step row.
   */
  getFrameBoxes(): SequenceFrame[] {
    // HEADER_HEIGHT: vertical space reserved per header band (badge + condition text).
    // Must match FRAME_HEADER_HEIGHT used in finalizeFrameConstraints so the row
    // gap added by the solver exactly accommodates the stacked header bands.
    const HEADER_HEIGHT = FRAME_HEADER_HEIGHT
    const PADDING = 12
    const DEPTH_INSET = 8

    // --- Pre-compute per-frame minRow ---
    const frameMinRow = new Map<string, number>()
    for (const f of this.#pendingFrames) {
      const allRows = f.branches.flatMap(b => [b.rowStart, b.rowEnd])
      frameMinRow.set(f.id, Math.min(...allRows))
    }

    // Build parent-lookup map for ancestor traversal
    const frameById = new Map(this.#pendingFrames.map(f => [f.id, f]))

    // For each frame, compute the maximum depth found among all descendants
    // (via parent chain) that share the same minRow. Outermost frames at the
    // same first-row get the most upward extension so their header band sits
    // above all child header bands; innermost get exactly HEADER_HEIGHT above firstRow.y.
    const maxDescSameRowDepth = new Map<string, number>()
    for (const f of this.#pendingFrames) {
      if (!maxDescSameRowDepth.has(f.id)) {
        maxDescSameRowDepth.set(f.id, f.depth)
      }
      const myMinRow = frameMinRow.get(f.id)!
      let parentId = f.parent
      while (parentId) {
        const parent = frameById.get(parentId)
        if (!parent) break
        if (frameMinRow.get(parentId) === myMinRow) {
          const prev = maxDescSameRowDepth.get(parentId) ?? parent.depth
          maxDescSameRowDepth.set(parentId, Math.max(prev, f.depth))
        }
        parentId = parent.parent
      }
    }

    return this.#pendingFrames.map((f) => {
      // Each nesting depth REDUCES width by DEPTH_INSET on each side
      // so deeper frames are visibly inset within their parent
      const inset = f.depth * DEPTH_INSET
      // Number of extra header bands this frame must reserve above firstRow.y:
      // (maxDescendantDepthAtSameRow - f.depth) gives how many same-row child
      // frames nest below this one and need their own header bands.
      const extraBands = (maxDescSameRowDepth.get(f.id) ?? f.depth) - f.depth

      const leftActorBox = this.actorBox(f.minCol)
      const rightActorBox = this.actorBox(f.maxCol)

      // depth=0: x = centerX - 30 - PADDING (outermost, widest)
      // depth=1: x = centerX - 30 - PADDING + DEPTH_INSET (narrower, shifted right)
      const x = Math.round(leftActorBox.centerX.value() - 30 - PADDING + inset)
      const right = Math.round(rightActorBox.centerX.value() + 30 + PADDING - inset)

      // Collect all row indices across all branches
      const allRows = f.branches.flatMap(b => [b.rowStart, b.rowEnd])
      const minRow = Math.min(...allRows)
      const maxRow = Math.max(...allRows)

      const firstRowData = this.#rows[minRow]
      const lastRowData = this.#rows[maxRow]
      invariant(firstRowData && lastRowData, `frame ${f.id} references invalid rows ${minRow}..${maxRow}`)

      // Frame y is placed ABOVE the first body-step row by HEADER_HEIGHT per band:
      //   1 band for this frame's own header + extraBands for any same-minRow children.
      // This stacks header bands vertically so parent badges always sit above child
      // badges and neither overlaps the first step arrow below firstRow.y.
      const y = Math.round(firstRowData.y.value() - HEADER_HEIGHT * (1 + extraBands))
      // Bottom padding shrinks with depth so a deeper (inner) frame always ends
      // strictly before its parent frame, preserving containment.
      const bottom = Math.round(lastRowData.bottom.value() + PADDING - f.depth * DEPTH_INSET)

      // Branch separators — stored as an offset RELATIVE to frame.y so that
      // FrameNode's `top: sepY` CSS always positions the dashed line at the
      // correct absolute Y regardless of frame.y value.
      //
      // Position: 8 px above the NEXT branch's first row (rather than the
      // midpoint between rows). This guarantees the separator appears just
      // above the branch content and stays below any nested child-frame header
      // that extends FRAME_HEADER_HEIGHT above the branch's first row.
      const BRANCH_SEP_GAP = 8
      const branches: SequenceFrameBranch[] = f.branches.map((branch, i) => {
        const separatorYs: number[] = []
        if (i < f.branches.length - 1) {
          const nextFirstRow = this.#rows[f.branches[i + 1]!.rowStart]
          if (nextFirstRow) {
            const sepYAbs = Math.round(nextFirstRow.y.value() - BRANCH_SEP_GAP)
            // Convert to offset relative to the frame node's top (frame.y)
            separatorYs.push(sepYAbs - y)
          }
        }
        return {
          label: branch.label,
          condition: branch.condition,
          rowStart: branch.rowStart,
          rowEnd: branch.rowEnd,
          separatorYs,
        }
      })

      return {
        id: f.id,
        kind: f.kind,
        label: f.label,
        condition: f.condition,
        depth: f.depth,
        parent: f.parent,
        x,
        y,
        width: right - x,
        height: bottom - y,
        branches,
      }
    })
  }

  /**
   * Returns resolved activation bars.
   */
  getActivations(): SequenceActivation[] {
    const viewStartY = 0
    const viewEndY = this.#viewportBottom.value()

    return this.#pendingActivations.map((a) => {
      let startY: number
      if (a.startYOverride !== null) {
        startY = a.startYOverride
      } else if (a.startRow !== null) {
        const rowData = this.#rows[a.startRow]
        startY = rowData ? Math.round(rowData.y.value()) : viewStartY
      } else {
        startY = viewStartY
      }

      let endY: number
      if (a.endYOverride !== null) {
        endY = a.endYOverride
      } else if (a.endRow !== null) {
        const rowData = this.#rows[a.endRow]
        endY = rowData ? Math.round(rowData.bottom.value()) : viewEndY
      } else {
        endY = viewEndY
      }

      return {
        actor: a.actor as NodeId,
        startStepId: a.startStepId as EdgeId | null,
        endStepId: a.endStepId as EdgeId | null,
        startY,
        endY,
        depth: a.depth,
      }
    })
  }

  /**
   * Returns resolved note boxes.
   */
  getNotes(): SequenceNote[] {
    const NOTE_HEIGHT = 32
    const NOTE_DEFAULT_WIDTH = 120
    const NOTE_GAP = 8
    const viewStartY = 0

    return this.#pendingNotes.map((n) => {
      let y: number
      if (n.afterRow !== null) {
        const rowData = this.#rows[n.afterRow]
        // Place the note AFTER the step row (at its bottom) so it does not
        // overlap the arrow/label of the step it annotates.
        y = rowData ? Math.round(rowData.bottom.value()) : viewStartY
      } else {
        y = viewStartY
      }

      // Determine actor columns for placement
      const actorIndices = n.actors.map(actorId => {
        const idx = this.#actors.findIndex(a => a.actor.id === actorId)
        return idx >= 0 ? idx : 0
      })
      const minCol = Math.min(...actorIndices)
      const maxCol = Math.max(...actorIndices)

      const leftBox = this.actorBox(minCol)
      const rightBox = this.actorBox(maxCol)

      let x: number
      let width: number

      switch (n.placement) {
        case 'over': {
          x = Math.round(leftBox.x.value())
          width = Math.round(rightBox.x.value() + rightBox.width - x)
          break
        }
        case 'left': {
          width = NOTE_DEFAULT_WIDTH
          x = Math.round(leftBox.x.value() - NOTE_GAP - width)
          break
        }
        case 'right': {
          x = Math.round(rightBox.x.value() + rightBox.width + NOTE_GAP)
          width = NOTE_DEFAULT_WIDTH
          break
        }
      }

      return {
        id: n.id,
        placement: n.placement,
        actors: n.actors as ReadonlyArray<NodeId>,
        text: n.text,
        x,
        y,
        width,
        height: NOTE_HEIGHT,
        afterStepId: n.afterStepId as EdgeId | null,
      }
    })
  }

  /** Row data accessor — used by sequence-view.ts for activation/note Y resolution */
  getRowY(rowIndex: number): number {
    const r = this.#rows[rowIndex]
    return r ? Math.round(r.y.value()) : 0
  }

  getRowBottom(rowIndex: number): number {
    const r = this.#rows[rowIndex]
    return r ? Math.round(r.bottom.value()) : 0
  }

  getViewStartY(): number {
    return 0
  }

  getViewEndY(): number {
    return Math.round(this.#viewportBottom.value())
  }

  getStepRow(stepId: string): number | undefined {
    return this.#stepRowMap.get(stepId)
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

  private addParallelRect({
    parallelPrefix,
    min,
    max,
  }: ParallelRect) {
    const x1 = this.actorBox(min.column).centerX.minus(30)
    const x2 = this.actorBox(max.column).centerX.plus(30)
    const firstRow = this.#rows[min.row]
    const lastRow = this.#rows[max.row]
    invariant(firstRow && lastRow, `parallel box invalid minRow=${min.row} maxRow=${max.row}`)

    const y1 = this.newVar(0)
    this.put(y1).before(firstRow.y, 40)
    const y2 = lastRow.bottom

    // margin top
    const rowBefore = min.row > 0 && this.#rows[min.row - 1]
    if (rowBefore) {
      this.put(y1).after(rowBefore.bottom, 16)
    }

    const rowAfter = max.row < this.#rows.length - 1 && this.#rows[max.row + 1]
    if (rowAfter) {
      this.put(y2).before(rowAfter.y, 16)
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
        this.#rowsTop.plus(FIRST_STEP_OFFSET)

      const y = this.newVar(this.#rows.length * MIN_ROW_HEIGHT)
      this.put(y).after(prevRowY)

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
    this.#solver.addEditVariable(v, kiwi.Strength.weak)
    if (typeof initialValue === 'number') {
      this.#solver.suggestValue(v, initialValue)
      this.constraint(v, '>=', 0, kiwi.Strength.strong)
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
}
