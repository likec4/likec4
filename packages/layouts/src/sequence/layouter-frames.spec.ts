/**
 * Golden BBox tests for SequenceFrame, SequenceActivation, SequenceNote layout.
 * All coordinates are rounded to integer pixels (Math.round) inside the layouter.
 *
 * Cassowary constants used (from const.ts):
 *   ACTOR_GAP = 60, COLUMN_GAP = 32
 *   MIN_ROW_HEIGHT = 80, PORT_HEIGHT = 32
 *   FIRST_STEP_OFFSET = 30
 *   STEP_LABEL_MARGIN = 50, CONTINUOUS_OFFSET = 22
 *
 * Frame layout constants (inside layouter.ts getFrameBoxes):
 *   HEADER_HEIGHT = 24, PADDING = 12, DEPTH_INSET = 8, DEPTH_PADDING = 4
 *
 * Activation: startY = rowData[row].y, endY = rowData[row].bottom
 * Note HEIGHT = 32, DEFAULT_WIDTH = 120, NOTE_GAP = 8
 *
 * Step IDs must start with 'step-' (isStepEdgeId contract).
 * Parallel step IDs contain '.' e.g. 'step-par.1', 'step-par.2'
 */

import type { ComputedDynamicView, DiagramEdge, DiagramNode } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { MIN_ROW_HEIGHT } from './const'
import { calcSequenceLayout } from './sequence-view'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTOR_WIDTH = 100
const ACTOR_HEIGHT = 60

function makeActor(id: string): DiagramNode {
  return {
    id,
    title: id,
    x: 0,
    y: 0,
    width: ACTOR_WIDTH,
    height: ACTOR_HEIGHT,
    children: [],
    parent: null,
    style: {},
    tags: [],
    links: [],
    labelBBox: { x: 0, y: 0, width: 100, height: 20 },
  } as unknown as DiagramNode
}

// Minimal LayoutedDynamicView-like object sufficient for calcSequenceLayout.
// Edge IDs must start with 'step-' (isStepEdgeId).
function makeView(
  actors: DiagramNode[],
  steps: Array<{ id: string; source: DiagramNode; target: DiagramNode }>,
  frames?: ComputedDynamicView['frames'],
  markers?: ComputedDynamicView['markers'],
): any {
  const edges = steps.map(s => ({
    id: s.id,
    source: s.source.id,
    target: s.target.id,
    label: null,
    labelBBox: null,
    navigateTo: null,
    points: [[0, 0], [1, 1]],
  }))
  return {
    id: 'test-view' as any,
    _type: 'dynamic',
    variant: 'sequence',
    nodes: actors,
    edges,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    frames,
    markers,
    sequenceLayout: {
      actors: [],
      compounds: [],
      parallelAreas: [],
      frames: [],
      activations: [],
      notes: [],
      steps: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    },
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Frame golden BBox tests
// ---------------------------------------------------------------------------

describe('SequenceFrame layout', () => {
  it('single if-frame across 3 steps / 2 actors: BBox within expected tolerance', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
      ],
      [
        {
          id: 'f1',
          kind: 'if',
          depth: 0,
          branches: [
            {
              stepIds: ['step-1', 'step-2', 'step-3'] as any[],
              markerIds: [],
            },
          ],
        },
      ],
    )

    const layout = calcSequenceLayout(view)

    expect(layout.frames).toHaveLength(1)
    const frame = layout.frames[0]!

    expect(frame.id).toBe('f1')
    expect(frame.kind).toBe('if')
    expect(frame.depth).toBe(0)

    const actorA = layout.actors.find(a => a.id === 'A')!
    const actorB = layout.actors.find(a => a.id === 'B')!

    // Frame must span to the left of actor A center
    expect(frame.x).toBeLessThan(actorA.x + ACTOR_WIDTH / 2)
    // Frame right edge must reach past actor B center
    expect(frame.x + frame.width).toBeGreaterThan(actorB.x + ACTOR_WIDTH / 2)
    // Frame top is above first step row (below actor boxes)
    expect(frame.y).toBeGreaterThan(actorA.y + ACTOR_HEIGHT)
    // Height covers at least 2 full row heights
    expect(frame.height).toBeGreaterThan(MIN_ROW_HEIGHT * 2)
    // Positive dimensions
    expect(frame.width).toBeGreaterThan(0)

    // One branch, no separators
    expect(frame.branches).toHaveLength(1)
    expect(frame.branches[0]!.separatorYs).toHaveLength(0)
  })

  it('single if-frame: output values are integers', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
      ],
      [
        {
          id: 'f1',
          kind: 'if',
          depth: 0,
          branches: [
            {
              stepIds: ['step-1', 'step-2'] as any[],
              markerIds: [],
            },
          ],
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    const frame = layout.frames[0]!

    // All frame coordinates must be integer pixels (rounded)
    expect(Number.isInteger(frame.x)).toBe(true)
    expect(Number.isInteger(frame.y)).toBe(true)
    expect(Number.isInteger(frame.width)).toBe(true)
    expect(Number.isInteger(frame.height)).toBe(true)

    // Frame must be wider than actor span
    const actorA = layout.actors.find(a => a.id === 'A')!
    const actorB = layout.actors.find(a => a.id === 'B')!
    const spanWidth = (actorB.x + ACTOR_WIDTH / 2) - (actorA.x + ACTOR_WIDTH / 2)
    expect(frame.width).toBeGreaterThan(spanWidth)
  })

  it('nested frame: inner frame is inset within outer frame', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
        { id: 'step-4', source: B, target: A },
      ],
      [
        // outer: if frame covering all 4 steps, depth=0
        {
          id: 'outer',
          kind: 'if',
          depth: 0,
          branches: [
            {
              stepIds: ['step-1', 'step-2', 'step-3', 'step-4'] as any[],
              markerIds: [],
            },
          ],
        },
        // inner: parallel frame covering steps 3-4, depth=1, parent='outer'
        {
          id: 'inner',
          kind: 'parallel',
          depth: 1,
          parent: 'outer',
          branches: [
            {
              label: 'branch a',
              stepIds: ['step-3'] as any[],
              markerIds: [],
            },
            {
              label: 'branch b',
              stepIds: ['step-4'] as any[],
              markerIds: [],
            },
          ],
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.frames).toHaveLength(2)

    const outer = layout.frames.find(f => f.id === 'outer')!
    const inner = layout.frames.find(f => f.id === 'inner')!

    // Inner frame must be horizontally inset within outer frame
    expect(inner.x).toBeGreaterThan(outer.x)
    expect(inner.x + inner.width).toBeLessThan(outer.x + outer.width)

    // Inner frame must be vertically within outer frame
    expect(inner.y).toBeGreaterThan(outer.y)
    expect(inner.y + inner.height).toBeLessThan(outer.y + outer.height)

    // Inner has 2 branches — should have 1 separator on the first branch
    expect(inner.branches).toHaveLength(2)
    expect(inner.branches[0]!.separatorYs).toHaveLength(1)

    // Separator Y is relative to the frame node's top (frame.y), so it must be
    // a positive offset within [0, frame.height].
    const sep = inner.branches[0]!.separatorYs[0]!
    expect(sep).toBeGreaterThan(0)
    expect(sep).toBeLessThan(inner.height)
  })

  it('3-deep nested: each level is strictly more inset than its parent', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
        { id: 'step-4', source: B, target: A },
        { id: 'step-5', source: A, target: B },
        { id: 'step-6', source: B, target: A },
      ],
      [
        {
          id: 'depth0',
          kind: 'if',
          depth: 0,
          branches: [
            {
              stepIds: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'] as any[],
              markerIds: [],
            },
          ],
        },
        {
          id: 'depth1',
          kind: 'repeat',
          depth: 1,
          parent: 'depth0',
          branches: [
            {
              stepIds: ['step-3', 'step-4', 'step-5', 'step-6'] as any[],
              markerIds: [],
            },
          ],
        },
        {
          id: 'depth2',
          kind: 'parallel',
          depth: 2,
          parent: 'depth1',
          branches: [
            {
              label: 'branch',
              stepIds: ['step-5', 'step-6'] as any[],
              markerIds: [],
            },
          ],
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.frames).toHaveLength(3)

    const d0 = layout.frames.find(f => f.id === 'depth0')!
    const d1 = layout.frames.find(f => f.id === 'depth1')!
    const d2 = layout.frames.find(f => f.id === 'depth2')!

    // Each deeper level is strictly more inset
    expect(d1.x).toBeGreaterThan(d0.x)
    expect(d1.x + d1.width).toBeLessThan(d0.x + d0.width)

    expect(d2.x).toBeGreaterThan(d1.x)
    expect(d2.x + d2.width).toBeLessThan(d1.x + d1.width)

    // depth-2 vs depth-0: at least 2 * DEPTH_INSET(8) = 16px more inset on left
    expect(d2.x - d0.x).toBeGreaterThanOrEqual(16)

    // All dimensions are positive integers
    for (const frame of [d0, d1, d2]) {
      expect(Number.isInteger(frame.x)).toBe(true)
      expect(Number.isInteger(frame.y)).toBe(true)
      expect(Number.isInteger(frame.width)).toBe(true)
      expect(Number.isInteger(frame.height)).toBe(true)
      expect(frame.width).toBeGreaterThan(0)
      expect(frame.height).toBeGreaterThan(0)
    }
  })

  it('legacy parallelAreas still populated (back-compat)', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    // Two parallel steps (same parallelPrefix via 'step-par.1', 'step-par.2')
    const view = makeView(
      [A, B],
      [
        { id: 'step-par.1', source: A, target: B },
        { id: 'step-par.2', source: B, target: A },
      ],
    )

    const layout = calcSequenceLayout(view)
    // Should have a parallel area (parallelPrefix = 'step-par.')
    expect(layout.parallelAreas).toHaveLength(1)
    expect(layout.parallelAreas[0]!.parallelPrefix).toBe('step-par.')

    // frames array is empty (no frames passed)
    expect(layout.frames).toHaveLength(0)
  })

  it('frame with if/else branches has separator between them', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
        { id: 'step-4', source: B, target: A },
      ],
      [
        {
          id: 'if1',
          kind: 'if',
          depth: 0,
          branches: [
            {
              label: 'if condition',
              stepIds: ['step-1', 'step-2'] as any[],
              markerIds: [],
            },
            {
              label: 'else',
              stepIds: ['step-3', 'step-4'] as any[],
              markerIds: [],
            },
          ],
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    const frame = layout.frames[0]!

    expect(frame.branches).toHaveLength(2)
    // First branch has 1 separator (midpoint to next branch)
    expect(frame.branches[0]!.separatorYs).toHaveLength(1)
    // Last branch has no separator
    expect(frame.branches[1]!.separatorYs).toHaveLength(0)

    const sep = frame.branches[0]!.separatorYs[0]!
    // Separator Y is relative to the frame node's top; must fall in (0, frame.height)
    expect(sep).toBeGreaterThan(0)
    expect(sep).toBeLessThan(frame.height)
  })
})

// ---------------------------------------------------------------------------
// Phase 2: Activation tests
// ---------------------------------------------------------------------------

describe('SequenceActivation layout', () => {
  it('activation from step k to step m spans expected Y range', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
      ],
      undefined,
      [
        { kind: 'activate', id: 'm1', actor: 'B' as any, afterStep: 'step-1' as any },
        { kind: 'deactivate', id: 'm2', actor: 'B' as any, afterStep: 'step-2' as any },
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.activations).toHaveLength(1)

    const activation = layout.activations[0]!
    expect(activation.actor).toBe('B')
    expect(activation.depth).toBe(0)
    expect(activation.startY).toBeGreaterThan(0)
    expect(activation.endY).toBeGreaterThan(activation.startY)
  })

  it('two overlapping activations on same actor: inner has depth=1', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
        { id: 'step-3', source: A, target: B },
        { id: 'step-4', source: B, target: A },
      ],
      undefined,
      [
        { kind: 'activate', id: 'm1', actor: 'A' as any, afterStep: 'step-1' as any },
        { kind: 'activate', id: 'm2', actor: 'A' as any, afterStep: 'step-2' as any },
        { kind: 'deactivate', id: 'm3', actor: 'A' as any, afterStep: 'step-3' as any },
        { kind: 'deactivate', id: 'm4', actor: 'A' as any, afterStep: 'step-4' as any },
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.activations).toHaveLength(2)

    const inner = layout.activations.find(a => a.depth === 1)
    const outer = layout.activations.find(a => a.depth === 0)

    expect(inner).toBeDefined()
    expect(outer).toBeDefined()

    // Outer starts before or at inner
    expect(outer!.startY).toBeLessThanOrEqual(inner!.startY)
    // Outer ends after or at inner
    expect(outer!.endY).toBeGreaterThanOrEqual(inner!.endY)
  })

  it('unclosed activation extends to view bottom', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
      ],
      undefined,
      [
        { kind: 'activate', id: 'm1', actor: 'A' as any, afterStep: 'step-1' as any },
        // no deactivate — should extend to view bottom
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.activations).toHaveLength(1)

    const activation = layout.activations[0]!
    // endY == view height (getViewEndY)
    expect(activation.endY).toBe(layout.bounds.height)
  })
})

// ---------------------------------------------------------------------------
// Phase 3: Note tests
// ---------------------------------------------------------------------------

describe('SequenceNote layout', () => {
  it('note over both actors: x at left actor, width spans to right actor', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
        { id: 'step-2', source: B, target: A },
      ],
      undefined,
      [
        {
          kind: 'note',
          id: 'n1',
          placement: 'over',
          actors: ['A', 'B'] as any[],
          text: 'note text',
          afterStep: 'step-1' as any,
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    expect(layout.notes).toHaveLength(1)

    const note = layout.notes[0]!
    expect(note.placement).toBe('over')
    expect(note.id).toBe('n1')

    const actorA = layout.actors.find(a => a.id === 'A')!
    const actorB = layout.actors.find(a => a.id === 'B')!

    // x should be at actor A's left edge
    expect(note.x).toBe(Math.round(actorA.x))
    // right edge should be at actor B's right edge
    expect(note.x + note.width).toBe(Math.round(actorB.x + actorB.width))

    expect(note.height).toBe(32)
    expect(note.y).toBeGreaterThan(0)
  })

  it('note left of actor: right edge = actorA.x - NOTE_GAP', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
      ],
      undefined,
      [
        {
          kind: 'note',
          id: 'n2',
          placement: 'left',
          actors: ['A'] as any[],
          text: 'left note',
          afterStep: 'step-1' as any,
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    const note = layout.notes[0]!
    expect(note.placement).toBe('left')

    const actorA = layout.actors.find(a => a.id === 'A')!
    // note right edge = actorA.x - 8 (NOTE_GAP)
    expect(note.x + note.width).toBe(Math.round(actorA.x) - 8)
    expect(note.width).toBe(120)
    expect(note.height).toBe(32)
  })

  it('note right of actor: left edge = actorB.right + NOTE_GAP', () => {
    const A = makeActor('A')
    const B = makeActor('B')

    const view = makeView(
      [A, B],
      [
        { id: 'step-1', source: A, target: B },
      ],
      undefined,
      [
        {
          kind: 'note',
          id: 'n3',
          placement: 'right',
          actors: ['B'] as any[],
          text: 'right note',
          afterStep: 'step-1' as any,
        },
      ],
    )

    const layout = calcSequenceLayout(view)
    const note = layout.notes[0]!
    expect(note.placement).toBe('right')

    const actorB = layout.actors.find(a => a.id === 'B')!
    // note left edge = actorB.x + actorB.width + 8 (NOTE_GAP)
    expect(note.x).toBe(Math.round(actorB.x + actorB.width) + 8)
    expect(note.width).toBe(120)
    expect(note.height).toBe(32)
  })
})
