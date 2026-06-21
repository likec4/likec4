import { describe, expect, it } from 'vitest'
import type {
  DynamicViewElement,
  DynamicViewRule,
  ParsedDynamicView as DynamicView,
  ViewId,
} from '../../../types'
import { fakeModel } from '../../element-view/__test__/fixture'
import { computeDynamicView } from '../compute'

// ─── helpers ──────────────────────────────────────────────────────────────────

const emptyView = {
  _type: 'dynamic' as const,
  id: 'index' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: [] as DynamicViewRule[],
}

// Tests use `any` casts to avoid complex generic instantiation.
// Runtime correctness is what matters; types are verified by the main source files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = DynamicViewElement<any>

function computeView(
  elements: El[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: Partial<Pick<DynamicView<any>, 'autonumber'>>,
) {
  const view = computeDynamicView(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fakeModel as any,
    {
      ...emptyView,
      ...extra,
      steps: elements,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as DynamicView<any>,
  )
  return Object.assign(view, {
    nodeIds: view.nodes.map(n => n.id) as string[],
    edgeIds: view.edges.map(e => e.id) as string[],
  })
}

/** Build a forward DynamicStep */
function s(source: string, target: string): El {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { source, target, astPath: '', title: null } as any as El
}

/** Build a backward DynamicStep */
function sb(target: string, source: string): El {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { source, target, astPath: '', title: null, isBackward: true } as any as El
}

/** Shorthand to cast an object literal to El */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function el(obj: Record<string, unknown>): El {
  return obj as unknown as El
}

// ─── individual construct tests ───────────────────────────────────────────────

describe('frames + markers: individual constructs', () => {
  // ── if block ────────────────────────────────────────────────────────────────
  it('if block emits a frame with then/else branches', () => {
    const view = computeView([
      s('cloud.backend.graphql', 'amazon.s3'),
      el({
        kind: 'if',
        id: 'if-1',
        condition: 'authorized',
        thenBranch: { id: 'then-1', elements: [s('customer', 'cloud.frontend.dashboard')] },
        elseIfs: [],
        else: { id: 'else-1', elements: [s('customer', 'cloud.backend.graphql')] },
      }),
    ])

    expect(view.edgeIds).toEqual([
      'step-01',
      'step-02.alt.0.1', // if.then branch (index 0), pos 1
      'step-02.alt.1.1', // if.else branch (index 1 = last), pos 1
    ])

    expect(view.frames).toHaveLength(1)
    const frame = view.frames![0]!
    expect(frame.id).toBe('if-1')
    expect(frame.kind).toBe('if')
    expect(frame.condition).toBe('authorized')
    expect(frame.depth).toBe(0)
    expect(frame.parent).toBeUndefined()
    expect(frame.branches).toHaveLength(2)
    expect(frame.branches[0]!.stepIds).toEqual(['step-02.alt.0.1'])
    expect(frame.branches[1]!.stepIds).toEqual(['step-02.alt.1.1'])
  })

  it('if block with elseIf branches uses correct alt indices', () => {
    const view = computeView([
      el({
        kind: 'if',
        id: 'if-2',
        condition: 'role',
        thenBranch: { id: 'then-2', elements: [s('customer', 'cloud.frontend.dashboard')] },
        elseIfs: [
          {
            condition: 'isAdmin',
            body: { id: 'elif-1', elements: [s('customer', 'cloud.backend.graphql')] },
          },
        ],
        else: { id: 'else-2', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
      }),
    ])

    expect(view.edgeIds).toEqual([
      'step-01.alt.0.1', // then (index 0)
      'step-01.alt.1.1', // elseIf (index 1)
      'step-01.alt.2.1', // else (index 2)
    ])
    expect(view.frames![0]!.branches).toHaveLength(3)
    expect(view.frames![0]!.branches[1]!.condition).toBe('isAdmin')
  })

  // ── optional block ──────────────────────────────────────────────────────────
  it('optional block emits a frame with one branch', () => {
    const view = computeView([
      el({
        kind: 'optional',
        id: 'opt-1',
        condition: 'cacheHit',
        body: { id: 'body-1', elements: [s('cloud.frontend.dashboard', 'cloud.backend.graphql')] },
      }),
    ])

    expect(view.edgeIds).toEqual(['step-01.opt.1'])
    expect(view.frames).toHaveLength(1)

    const frame = view.frames![0]!
    expect(frame.kind).toBe('optional')
    expect(frame.condition).toBe('cacheHit')
    expect(frame.label).toBeUndefined()
    expect(frame.depth).toBe(0)
    expect(frame.branches).toHaveLength(1)
    expect(frame.branches[0]!.stepIds).toEqual(['step-01.opt.1'])
  })

  // ── repeat block ────────────────────────────────────────────────────────────
  it('repeat block emits a frame with one branch', () => {
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'),
      el({
        kind: 'repeat',
        id: 'loop-1',
        label: 'for each item',
        body: {
          id: 'body-loop',
          elements: [
            s('cloud.backend.graphql', 'amazon.s3'),
            s('cloud.backend.graphql', 'cloud.frontend.dashboard'),
          ],
        },
      }),
    ])

    expect(view.edgeIds).toEqual([
      'step-01',
      'step-02.loop.1',
      'step-02.loop.2',
    ])

    const frame = view.frames![0]!
    expect(frame.kind).toBe('repeat')
    expect(frame.label).toBe('for each item')
    expect(frame.branches[0]!.stepIds).toEqual(['step-02.loop.1', 'step-02.loop.2'])
  })

  it('repeat block without label has no label field', () => {
    const view = computeView([
      el({
        kind: 'repeat',
        id: 'loop-nolabel',
        body: { id: 'body-nolabel', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
      }),
    ])
    expect(view.frames![0]!.label).toBeUndefined()
    expect(view.edgeIds).toEqual(['step-01.loop.1'])
  })

  // ── group block ──────────────────────────────────────────────────────────────
  it('group block emits a frame', () => {
    const view = computeView([
      el({
        kind: 'group',
        id: 'grp-1',
        label: 'authentication',
        body: { id: 'body-grp', elements: [s('customer', 'cloud.frontend.dashboard')] },
      }),
    ])

    expect(view.edgeIds).toEqual(['step-01.grp.1'])

    const frame = view.frames![0]!
    expect(frame.kind).toBe('group')
    expect(frame.label).toBe('authentication')
    expect(frame.branches[0]!.stepIds).toEqual(['step-01.grp.1'])
  })

  // ── break block ──────────────────────────────────────────────────────────────
  it('break block emits a frame', () => {
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'),
      el({
        kind: 'break',
        id: 'brk-1',
        condition: 'error',
        body: { id: 'body-brk', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
      }),
    ])

    expect(view.edgeIds).toEqual(['step-01', 'step-02.brk.1'])

    const frame = view.frames![0]!
    expect(frame.kind).toBe('break')
    expect(frame.condition).toBe('error')
    expect(frame.label).toBeUndefined()
  })

  // ── critical block ───────────────────────────────────────────────────────────
  it('critical block emits a frame with body + fallback branches', () => {
    const view = computeView([
      el({
        kind: 'critical',
        id: 'crit-1',
        label: 'DB transaction',
        body: {
          id: 'crit-body',
          elements: [
            s('cloud.backend.graphql', 'amazon.s3'),
            s('cloud.backend.graphql', 'cloud.frontend.dashboard'),
          ],
        },
        fallbacks: [
          {
            label: 'rollback',
            body: { id: 'crit-fb-1', elements: [s('cloud.frontend.dashboard', 'cloud.backend.graphql')] },
          },
        ],
      }),
    ])

    expect(view.edgeIds).toEqual([
      'step-01.crit.body.1',
      'step-01.crit.body.2',
      'step-01.crit.on.1.1',
    ])

    const frame = view.frames![0]!
    expect(frame.kind).toBe('critical')
    expect(frame.label).toBe('DB transaction')
    expect(frame.branches).toHaveLength(2)
    expect(frame.branches[0]!.label).toBe('DB transaction')
    expect(frame.branches[0]!.stepIds).toEqual(['step-01.crit.body.1', 'step-01.crit.body.2'])
    expect(frame.branches[1]!.label).toBe('rollback')
    expect(frame.branches[1]!.stepIds).toEqual(['step-01.crit.on.1.1'])
  })

  // ── labeled parallel branches ────────────────────────────────────────────────
  it('parallel with labeled branches emits a frame', () => {
    const view = computeView([
      el({
        parallelId: 'par-1',
        // __parallel is used by elementsFromSteps for actor extraction
        __parallel: [
          s('customer', 'cloud.frontend.dashboard'),
          s('cloud.backend.graphql', 'amazon.s3'),
        ],
        branches: [
          { label: 'branch A', elements: [s('customer', 'cloud.frontend.dashboard')] },
          { label: 'branch B', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
        ],
      }),
    ])

    expect(view.edgeIds).toEqual([
      'step-01.par.1.1',
      'step-01.par.2.1',
    ])

    const frame = view.frames![0]!
    expect(frame.id).toBe('par-1')
    expect(frame.kind).toBe('parallel')
    expect(frame.branches).toHaveLength(2)
    expect(frame.branches[0]!.label).toBe('branch A')
    expect(frame.branches[0]!.stepIds).toEqual(['step-01.par.1.1'])
    expect(frame.branches[1]!.label).toBe('branch B')
    expect(frame.branches[1]!.stepIds).toEqual(['step-01.par.2.1'])
  })

  // ── note marker ──────────────────────────────────────────────────────────────
  it('note over emits a marker with correct afterStep', () => {
    // note is at top-level slot 2 (no edge); the next step is at slot 3
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'),
      el({
        kind: 'note',
        id: 'note-1',
        placement: 'over',
        actors: ['customer', 'cloud.frontend.dashboard'],
        text: 'user action',
      }),
      s('cloud.frontend.dashboard', 'cloud.backend.graphql'),
    ])

    expect(view.edgeIds).toEqual(['step-01', 'step-03'])
    expect(view.markers).toHaveLength(1)

    const marker = view.markers![0]!
    expect(marker.kind).toBe('note')
    expect(marker.id).toBe('note-1')
    if (marker.kind === 'note') {
      expect(marker.placement).toBe('over')
      expect(marker.text).toBe('user action')
    }
    expect(marker.afterStep).toBe('step-01')
  })

  // ── activate / deactivate markers ────────────────────────────────────────────
  it('activate and deactivate emit markers with afterStep', () => {
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'), // slot 1 → step-01
      el({ kind: 'activate', id: 'act-1', actor: 'cloud.frontend.dashboard' }), // slot 2 → marker
      s('cloud.frontend.dashboard', 'cloud.backend.graphql'), // slot 3 → step-03
      el({ kind: 'deactivate', id: 'deact-1', actor: 'cloud.frontend.dashboard' }), // slot 4 → marker
    ])

    expect(view.edgeIds).toEqual(['step-01', 'step-03'])
    expect(view.markers).toHaveLength(2)

    const activate = view.markers![0]!
    expect(activate.kind).toBe('activate')
    expect(activate.afterStep).toBe('step-01')

    const deactivate = view.markers![1]!
    expect(deactivate.kind).toBe('deactivate')
    expect(deactivate.afterStep).toBe('step-03')
  })

  // ── create / destroy markers ─────────────────────────────────────────────────
  it('create and destroy emit markers; create before any step has no afterStep', () => {
    const view = computeView([
      el({ kind: 'create', id: 'create-1', actor: 'customer' }), // slot 1 → marker, no prior step
      s('customer', 'cloud.frontend.dashboard'), // slot 2 → step-02
      el({ kind: 'destroy', id: 'destroy-1', actor: 'customer' }), // slot 3 → marker
    ])

    expect(view.edgeIds).toEqual(['step-02'])
    expect(view.markers).toHaveLength(2)

    const create = view.markers![0]!
    expect(create.kind).toBe('create')
    expect(create.id).toBe('create-1')
    expect(create.afterStep).toBeUndefined() // no step emitted yet

    const destroy = view.markers![1]!
    expect(destroy.kind).toBe('destroy')
    expect(destroy.afterStep).toBe('step-02')
  })

  // ── autonumber ───────────────────────────────────────────────────────────────
  it('autonumber: enabled=true propagates to computed view', () => {
    const view = computeView(
      [s('customer', 'cloud.frontend.dashboard')],
      { autonumber: { enabled: true } },
    )
    expect(view.autonumber).toEqual({ enabled: true })
  })

  it('autonumber: from N step M propagates', () => {
    const view = computeView(
      [s('customer', 'cloud.frontend.dashboard')],
      { autonumber: { enabled: true, start: 10, step: 5 } },
    )
    expect(view.autonumber).toEqual({ enabled: true, start: 10, step: 5 })
  })

  it('autonumber: absent when not set', () => {
    const view = computeView([s('customer', 'cloud.frontend.dashboard')])
    expect(view.autonumber).toBeUndefined()
  })
})

// ─── end-to-end showcase ──────────────────────────────────────────────────────

describe('frames + markers: end-to-end showcase', () => {
  it('showcase: every construct in one view', () => {
    /**
     * Every top-level element advances the NN counter (including markers that emit no edge).
     *
     * Slots and expected output:
     *   01: plain step → step-01
     *   02: note (marker, no edge) → marker with afterStep=step-01
     *   03: if block → step-03.alt.0.1 (then), step-03.alt.1.1 (else)
     *   04: optional → step-04.opt.1
     *   05: repeat → step-05.loop.1, step-05.loop.2
     *   06: group → step-06.grp.1
     *   07: critical → step-07.crit.body.1, step-07.crit.on.1.1
     *   08: break → step-08.brk.1
     *   09: labeled parallel → step-09.par.1.1, step-09.par.2.1
     *   10: plain step → step-10
     */

    const elements: El[] = [
      // 01
      s('customer', 'cloud.frontend.dashboard'),
      // 02 – note (no edge)
      el({ kind: 'note', id: 'note-showcase', placement: 'over', actors: ['customer'], text: 'begins' }),
      // 03 – if
      el({
        kind: 'if',
        id: 'if-showcase',
        condition: 'logged in',
        thenBranch: { id: 'then-s', elements: [s('customer', 'cloud.frontend.dashboard')] },
        elseIfs: [],
        else: { id: 'else-s', elements: [s('customer', 'cloud.backend.graphql')] },
      }),
      // 04 – optional
      el({
        kind: 'optional',
        id: 'opt-showcase',
        condition: 'hasCache',
        body: { id: 'opt-body-s', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
      }),
      // 05 – repeat
      el({
        kind: 'repeat',
        id: 'loop-showcase',
        body: {
          id: 'loop-body-s',
          elements: [
            s('cloud.backend.graphql', 'amazon.s3'),
            s('cloud.backend.graphql', 'cloud.frontend.dashboard'),
          ],
        },
      }),
      // 06 – group
      el({
        kind: 'group',
        id: 'grp-showcase',
        label: 'response',
        body: { id: 'grp-body-s', elements: [s('cloud.frontend.dashboard', 'customer')] },
      }),
      // 07 – critical
      el({
        kind: 'critical',
        id: 'crit-showcase',
        label: 'tx',
        body: { id: 'crit-body-s', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
        fallbacks: [
          {
            label: 'rollback',
            body: { id: 'crit-fb-s', elements: [s('cloud.frontend.dashboard', 'cloud.backend.graphql')] },
          },
        ],
      }),
      // 08 – break
      el({
        kind: 'break',
        id: 'brk-showcase',
        condition: 'timeout',
        body: { id: 'brk-body-s', elements: [s('cloud.backend.graphql', 'cloud.frontend.dashboard')] },
      }),
      // 09 – labeled parallel
      el({
        parallelId: 'par-showcase',
        // __parallel is used by elementsFromSteps for actor extraction
        __parallel: [
          s('customer', 'cloud.frontend.dashboard'),
          s('cloud.backend.graphql', 'amazon.s3'),
        ],
        branches: [
          { label: 'A', elements: [s('customer', 'cloud.frontend.dashboard')] },
          { label: 'B', elements: [s('cloud.backend.graphql', 'amazon.s3')] },
        ],
      }),
      // 10
      s('cloud.backend.graphql', 'amazon.s3'),
    ]

    const view = computeView(elements)

    // --- edge IDs ---
    // Note occupies slot 02 but emits no edge
    expect(view.edgeIds).toEqual([
      'step-01',
      'step-03.alt.0.1',
      'step-03.alt.1.1',
      'step-04.opt.1',
      'step-05.loop.1',
      'step-05.loop.2',
      'step-06.grp.1',
      'step-07.crit.body.1',
      'step-07.crit.on.1.1',
      'step-08.brk.1',
      'step-09.par.1.1',
      'step-09.par.2.1',
      'step-10',
    ])

    // --- frames: if + optional + repeat + group + critical + break + parallel = 7 ---
    expect(view.frames).toHaveLength(7)

    // --- marker ---
    expect(view.markers).toHaveLength(1)
    expect(view.markers![0]!.kind).toBe('note')
    expect(view.markers![0]!.afterStep).toBe('step-01')
  })
})

// ─── invariant tests ──────────────────────────────────────────────────────────

describe('frames + markers: invariants', () => {
  // ── top-level NN monotonicity ─────────────────────────────────────────────────
  it('top-level step-NN values are strictly monotonic', () => {
    // if-block has 3 nested steps but occupies only ONE top-level slot (02)
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'), // slot 1 → step-01
      el({
        kind: 'if',
        id: 'inv-if',
        condition: 'cond',
        thenBranch: {
          id: 'inv-then',
          elements: [
            s('customer', 'cloud.frontend.dashboard'),
            s('cloud.frontend.dashboard', 'cloud.backend.graphql'),
            s('cloud.backend.graphql', 'amazon.s3'),
          ],
        },
        elseIfs: [],
      }),
      s('cloud.backend.graphql', 'amazon.s3'), // slot 3 → step-03 (NOT step-05)
    ])

    const topNNs = view.edgeIds.map(id => {
      const match = /^step-(\d+)/.exec(id as string)
      return match ? parseInt(match[1]!, 10) : -1
    })

    // Distinct top-level NN values must be strictly increasing
    const distinctNNs = [...new Set(topNNs)]
    for (let i = 1; i < distinctNNs.length; i++) {
      expect(distinctNNs[i]!).toBeGreaterThan(distinctNNs[i - 1]!)
    }

    // The last edge must be step-03, not step-05 or higher
    expect(view.edgeIds.at(-1)).toBe('step-03')
  })

  // ── frame branch coverage ─────────────────────────────────────────────────────
  it('frame branch stepIds are a subset of view.edgeIds', () => {
    const view = computeView([
      el({
        kind: 'critical',
        id: 'crit-inv',
        label: 'tx',
        body: {
          id: 'crit-inv-body',
          elements: [s('cloud.backend.graphql', 'amazon.s3')],
        },
        fallbacks: [
          {
            label: 'rollback',
            body: { id: 'crit-inv-fb', elements: [s('cloud.frontend.dashboard', 'cloud.backend.graphql')] },
          },
        ],
      }),
    ])

    const edgeIdSet = new Set(view.edgeIds as string[])

    for (const frame of view.frames ?? []) {
      for (const branch of frame.branches) {
        for (const stepId of branch.stepIds) {
          expect(edgeIdSet.has(stepId as string)).toBe(true)
        }
      }
    }
  })

  // ── marker afterStep references real EdgeIds ──────────────────────────────────
  it('marker afterStep references a real edge or is undefined', () => {
    const view = computeView([
      el({ kind: 'note', id: 'note-inv', placement: 'over', actors: ['customer'], text: 'test' }), // slot 1, no prior step
      s('customer', 'cloud.frontend.dashboard'), // slot 2 → step-02
      el({ kind: 'activate', id: 'act-inv', actor: 'customer' }), // slot 3 → marker
    ])

    const edgeIdSet = new Set(view.edgeIds as string[])
    for (const marker of view.markers ?? []) {
      if (marker.afterStep !== undefined) {
        expect(edgeIdSet.has(marker.afterStep as string)).toBe(true)
      }
    }

    // First marker (note before any step) must have no afterStep
    expect(view.markers![0]!.afterStep).toBeUndefined()
  })

  // ── legacy parallel (back-compat) ─────────────────────────────────────────────
  it('legacy parallel flat-children keeps step-NN.M IDs', () => {
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'), // slot 1 → step-01
      el({
        parallelId: 'par-legacy',
        __parallel: [
          s('customer', 'cloud.frontend.dashboard'),
          s('cloud.backend.graphql', 'amazon.s3'),
        ],
        // No branches → legacy flat form
      }),
      s('cloud.backend.graphql', 'cloud.frontend.dashboard'), // slot 3 → step-03
    ])

    expect(view.edgeIds).toEqual([
      'step-01',
      'step-02.1',
      'step-02.2',
      'step-03',
    ])

    // No frames emitted for legacy parallel
    expect(view.frames).toBeUndefined()
  })

  // ── no frames/markers when not present ───────────────────────────────────────
  it('frames and markers are absent for plain step-only views', () => {
    const view = computeView([
      s('customer', 'cloud.frontend.dashboard'),
      s('cloud.frontend.dashboard', 'cloud.backend.graphql'),
    ])

    expect(view.frames).toBeUndefined()
    expect(view.markers).toBeUndefined()
    expect(view.autonumber).toBeUndefined()
  })
})
