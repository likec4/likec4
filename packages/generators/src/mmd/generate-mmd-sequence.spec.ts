/**
 * Tests for generateMermaidSequence — Mermaid sequenceDiagram emitter.
 *
 * Each test builds a minimal ComputedDynamicView fixture with a single
 * construct and asserts the output via snapshot.
 *
 * Snapshot tip: paste any snapshot value into https://mermaid.live to
 * verify it renders correctly.
 */

import type { LikeC4ViewModel } from '@likec4/core/model'
import type { ComputedDynamicView, ComputedEdge, ComputedFrame, ComputedMarker, ComputedNode } from '@likec4/core/types'
import type { aux } from '@likec4/core/types'
import { describe, test, vi } from 'vitest'
import { generateMermaidSequence } from './generate-mmd-sequence'

// ---------------------------------------------------------------------------
// Helpers to build minimal fixture objects
// ---------------------------------------------------------------------------

function makeNode(id: string, title: string): ComputedNode {
  return {
    id: id as any,
    kind: 'system' as any,
    title,
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    shape: 'rectangle' as any,
    color: 'primary' as any,
    style: {},
    level: 0,
    tags: [] as any,
  }
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
  overrides?: Partial<ComputedEdge>,
): ComputedEdge {
  return {
    id: id as any,
    source: source as any,
    target: target as any,
    label: label ?? null,
    parent: null,
    relations: [],
    color: 'primary' as any,
    line: 'solid' as any,
    tags: [] as any,
    ...overrides,
  }
}

const NODE_A = makeNode('a', 'Alice')
const NODE_B = makeNode('b', 'Bob')
const NODE_C = makeNode('c', 'Carol')

function makeDynamicView(
  partial: Partial<ComputedDynamicView> & {
    edges: ComputedDynamicView['edges']
    nodes?: ComputedDynamicView['nodes']
  },
): ComputedDynamicView {
  return {
    _type: 'dynamic',
    _stage: 'computed',
    id: 'test' as any,
    title: 'Test',
    variant: 'sequence',
    autoLayout: { direction: 'TB' } as any,
    hash: 'abc',
    rules: [],
    nodes: partial.nodes ?? [NODE_A, NODE_B],
    ...partial,
  } as unknown as ComputedDynamicView
}

const mockViewModel = vi.fn(function($view: ComputedDynamicView) {
  return {
    titleOrId: $view.title ?? $view.id,
    $view,
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

// ---------------------------------------------------------------------------
// Basic steps
// ---------------------------------------------------------------------------

describe('basic steps', () => {
  test('solid arrow (default)', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'hello')],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('dashed arrow (line=dashed)', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'async call', { line: 'dashed' as any })],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('open arrow (head=open)', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'fire-and-forget', { head: 'open' as any })],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('backward edge (dir=back)', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'response', { dir: 'back' })],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('self-loop (source === target)', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'a', 'internal')],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('label escaping — colon in label', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'POST /api: create')],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('label escaping — newline in label', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'line one\nline two')],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// autonumber
// ---------------------------------------------------------------------------

describe('autonumber', () => {
  test('autonumber bare', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      autonumber: { enabled: true },
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('autonumber with start', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      autonumber: { enabled: true, start: 5 },
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('autonumber with start and step', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      autonumber: { enabled: true, start: 1, step: 2 },
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('autonumber disabled — no autonumber line', ({ expect }) => {
    const view = makeDynamicView({
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      autonumber: { enabled: false },
    })
    const out = generateMermaidSequence(mockViewModel(view))
    expect(out).not.toContain('autonumber')
    expect(out).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// Participant declarations
// ---------------------------------------------------------------------------

test('participant declarations in node order', ({ expect }) => {
  const view = makeDynamicView({
    nodes: [NODE_A, NODE_B, NODE_C],
    edges: [makeEdge('step-01', 'a', 'b', 'x')],
  })
  const out = generateMermaidSequence(mockViewModel(view))
  expect(out).toMatchSnapshot()
})

// ---------------------------------------------------------------------------
// Frames — keyword mapping
// ---------------------------------------------------------------------------

describe('frames', () => {
  test('if (alt)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'in if')],
      frames: [
        {
          id: 'f1',
          kind: 'if',
          condition: 'items in cart',
          depth: 0,
          parent: undefined,
          branches: [
            { condition: 'items in cart', label: undefined, stepIds: ['step-01' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('if/else if/else', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [
        makeEdge('step-01', 'a', 'b', 'branch 1'),
        makeEdge('step-02', 'a', 'b', 'branch 2'),
        makeEdge('step-03', 'a', 'b', 'branch 3'),
      ],
      frames: [
        {
          id: 'f1',
          kind: 'if',
          condition: 'c1',
          depth: 0,
          parent: undefined,
          branches: [
            { condition: 'c1', label: undefined, stepIds: ['step-01' as any], markerIds: [] },
            { condition: 'c2', label: undefined, stepIds: ['step-02' as any], markerIds: [] },
            { condition: undefined, label: undefined, stepIds: ['step-03' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('optional (opt)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'maybe')],
      frames: [
        {
          id: 'f1',
          kind: 'optional',
          condition: 'address valid',
          depth: 0,
          parent: undefined,
          branches: [
            { condition: 'address valid', label: undefined, stepIds: ['step-01' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('repeat (loop)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'retry')],
      frames: [
        {
          id: 'f1',
          kind: 'repeat',
          label: 'retry 3 times',
          depth: 0,
          parent: undefined,
          branches: [
            { label: 'retry 3 times', condition: undefined, stepIds: ['step-01' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('parallel with labeled branches (par/and)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B, NODE_C],
      edges: [
        makeEdge('step-01', 'a', 'b', 'branch a work'),
        makeEdge('step-02', 'a', 'c', 'branch b work'),
      ],
      frames: [
        {
          id: 'f1',
          kind: 'parallel',
          depth: 0,
          parent: undefined,
          branches: [
            { label: 'sync', condition: undefined, stepIds: ['step-01' as any], markerIds: [] },
            { label: 'async', condition: undefined, stepIds: ['step-02' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('group (rect)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'grouped call')],
      frames: [
        {
          id: 'f1',
          kind: 'group',
          label: 'auth block',
          depth: 0,
          parent: undefined,
          branches: [
            { label: 'auth block', condition: undefined, stepIds: ['step-01' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('critical/on (critical/option)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [
        makeEdge('step-01', 'a', 'b', 'try'),
        makeEdge('step-02', 'a', 'b', 'fallback'),
      ],
      frames: [
        {
          id: 'f1',
          kind: 'critical',
          label: 'payment success',
          depth: 0,
          parent: undefined,
          branches: [
            { label: 'payment success', condition: undefined, stepIds: ['step-01' as any], markerIds: [] },
            { label: 'insufficient funds', condition: undefined, stepIds: ['step-02' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('break', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'abort')],
      frames: [
        {
          id: 'f1',
          kind: 'break',
          condition: 'empty cart',
          depth: 0,
          parent: undefined,
          branches: [
            { condition: 'empty cart', label: undefined, stepIds: ['step-01' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('nested frames (frame inside frame)', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [
        makeEdge('step-01', 'a', 'b', 'outer step'),
        makeEdge('step-02', 'a', 'b', 'inner step'),
        makeEdge('step-03', 'a', 'b', 'after outer'),
      ],
      frames: [
        {
          id: 'outer',
          kind: 'repeat',
          label: 'outer loop',
          depth: 0,
          parent: undefined,
          branches: [
            { label: 'outer loop', condition: undefined, stepIds: ['step-01' as any, 'step-02' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
        {
          id: 'inner',
          kind: 'optional',
          condition: 'maybe',
          depth: 1,
          parent: 'outer',
          branches: [
            { condition: 'maybe', label: undefined, stepIds: ['step-02' as any], markerIds: [] },
          ],
        } as unknown as ComputedFrame,
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

describe('markers', () => {
  test('note over two actors', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      markers: [
        {
          kind: 'note',
          id: 'm1',
          placement: 'over',
          actors: ['a' as any, 'b' as any],
          text: 'shopping phase',
          afterStep: 'step-01' as any,
        },
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('note left of', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      markers: [
        {
          kind: 'note',
          id: 'm1',
          placement: 'left',
          actors: ['b' as any],
          text: 'note on left',
          afterStep: 'step-01' as any,
        },
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('note right of', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      markers: [
        {
          kind: 'note',
          id: 'm1',
          placement: 'right',
          actors: ['a' as any],
          text: 'note on right',
          afterStep: 'step-01' as any,
        },
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('activate / deactivate', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'call')],
      markers: [
        { kind: 'activate', id: 'm1', actor: 'b' as any },
        { kind: 'deactivate', id: 'm2', actor: 'b' as any, afterStep: 'step-01' as any },
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })

  test('create participant — skips header declaration', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B, NODE_C],
      edges: [
        makeEdge('step-01', 'a', 'b', 'first'),
        makeEdge('step-02', 'a', 'c', 'to created'),
      ],
      markers: [
        { kind: 'create', id: 'm1', actor: 'c' as any, afterStep: 'step-01' as any },
      ],
    })
    const out = generateMermaidSequence(mockViewModel(view))
    // Carol must NOT appear as a regular header `participant ... as Carol` line — only via `create participant`
    const lines = out.split('\n')
    const headerParticipants = lines.filter(l => /^\s*participant\s+\S+\s+as\s+Carol/.test(l))
    expect(headerParticipants).toHaveLength(0)
    // Mermaid `create participant <fqn> as <title>` matches the header convention so subsequent
    // step lines referencing the FQN still resolve.
    expect(out).toContain('create participant C as Carol')
    expect(out).toMatchSnapshot()
  })

  test('destroy', ({ expect }) => {
    const view = makeDynamicView({
      nodes: [NODE_A, NODE_B],
      edges: [makeEdge('step-01', 'a', 'b', 'last call')],
      markers: [
        { kind: 'destroy', id: 'm1', actor: 'b' as any, afterStep: 'step-01' as any },
      ],
    })
    expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// End-to-end showcase
// (paste the snapshot value into https://mermaid.live to verify it renders)
// ---------------------------------------------------------------------------

test('showcase — all constructs end-to-end (paste into mermaid.live to verify)', ({ expect }) => {
  // Full view exercising every keyword from the mapping table in one coherent fixture.
  // This mirrors the structure of examples/dynamic-sequence-showcase/views.c4 as a
  // pure-TypeScript fixture so the test is self-contained.
  const nodeUser = makeNode('user', 'User')
  const nodeWeb = makeNode('web', 'Web')
  const nodeApi = makeNode('api', 'API')
  const nodeAuth = makeNode('auth', 'Auth')
  const nodePayment = makeNode('payment', 'Payment')
  const nodeNotifier = makeNode('notifier', 'Notifier')
  const nodeDb = makeNode('db', 'Database')

  const edges: ComputedEdge[] = [
    makeEdge('e01', 'user', 'web', 'browse'), // top-level before any frame
    makeEdge('e02', 'user', 'web', 'click checkout'), // inside if branch 1
    makeEdge('e03', 'web', 'api', 'initiate checkout'), // inside if branch 1
    makeEdge('e04', 'web', 'user', 'reminder', { dir: 'back' }), // inside if/else-if branch 2
    makeEdge('e05', 'user', 'web', 'abort', { line: 'dashed' as any }), // inside break (nested in else-if)
    makeEdge('e06', 'web', 'api', 'fallback', { head: 'open' as any }), // inside else branch 3
    makeEdge('e07', 'user', 'web', 'address'), // inside optional
    makeEdge('e08', 'api', 'payment', 'charge'), // inside repeat > group
    makeEdge('e09', 'payment', 'api', 'confirmed'), // inside repeat > critical branch 1
    makeEdge('e10', 'payment', 'api', 'declined'), // inside repeat > critical branch 2
    makeEdge('e11', 'api', 'db', 'insert'), // inside parallel branch 1
    makeEdge('e12', 'api', 'notifier', 'notify'), // inside parallel branch 2
    makeEdge('user', 'web', 'done', 'order confirmation'), // top-level after all frames
  ]

  const frames: ComputedFrame[] = [
    // if / else-if / else
    {
      id: 'if1',
      kind: 'if',
      condition: 'items in cart',
      depth: 0,
      parent: undefined,
      branches: [
        { condition: 'items in cart', label: undefined, stepIds: ['e02' as any, 'e03' as any], markerIds: [] },
        { condition: 'abandoned cart', label: undefined, stepIds: ['e04' as any, 'e05' as any], markerIds: [] },
        { condition: undefined, label: undefined, stepIds: ['e06' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
    // break nested in else-if — depth 1, parent 'if1'
    {
      id: 'brk1',
      kind: 'break',
      condition: 'empty cart',
      depth: 1,
      parent: 'if1',
      branches: [
        { condition: 'empty cart', label: undefined, stepIds: ['e05' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
    // optional
    {
      id: 'opt1',
      kind: 'optional',
      condition: 'address valid',
      depth: 0,
      parent: undefined,
      branches: [
        { condition: 'address valid', label: undefined, stepIds: ['e07' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
    // repeat
    {
      id: 'rep1',
      kind: 'repeat',
      label: 'retry 3 times',
      depth: 0,
      parent: undefined,
      branches: [
        {
          label: 'retry 3 times',
          condition: undefined,
          stepIds: ['e08' as any, 'e09' as any, 'e10' as any],
          markerIds: [],
        },
      ],
    } as unknown as ComputedFrame,
    // group nested inside repeat
    {
      id: 'grp1',
      kind: 'group',
      label: 'payment processing',
      depth: 1,
      parent: 'rep1',
      branches: [
        { label: 'payment processing', condition: undefined, stepIds: ['e08' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
    // critical nested inside repeat
    {
      id: 'crit1',
      kind: 'critical',
      label: 'payment success',
      depth: 1,
      parent: 'rep1',
      branches: [
        { label: 'payment success', condition: undefined, stepIds: ['e09' as any], markerIds: [] },
        { label: 'insufficient funds', condition: undefined, stepIds: ['e10' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
    // parallel (labeled branches)
    {
      id: 'par1',
      kind: 'parallel',
      depth: 0,
      parent: undefined,
      branches: [
        { label: 'sync record', condition: undefined, stepIds: ['e11' as any], markerIds: [] },
        { label: 'async notify', condition: undefined, stepIds: ['e12' as any], markerIds: [] },
      ],
    } as unknown as ComputedFrame,
  ]

  const markers: ComputedMarker[] = [
    { kind: 'activate', id: 'mk-act-user', actor: 'user' as any },
    {
      kind: 'note',
      id: 'mk-note-start',
      placement: 'over',
      actors: ['user' as any, 'web' as any],
      text: 'Shopping phase',
      afterStep: 'e01' as any,
    },
    {
      kind: 'note',
      id: 'mk-note-addr',
      placement: 'left',
      actors: ['web' as any],
      text: 'Address validation',
      afterStep: 'e07' as any,
    },
    { kind: 'create', id: 'mk-create-notifier', actor: 'notifier' as any, afterStep: 'e10' as any },
    {
      kind: 'note',
      id: 'mk-note-end',
      placement: 'right',
      actors: ['api' as any],
      text: 'Payment confirmed',
      afterStep: 'e12' as any,
    },
    { kind: 'destroy', id: 'mk-destroy-notifier', actor: 'notifier' as any, afterStep: 'e12' as any },
    { kind: 'deactivate', id: 'mk-deact-user', actor: 'user' as any, afterStep: 'user' as any },
  ]

  const view = makeDynamicView({
    id: 'checkout-flow' as any,
    title: 'Checkout Flow',
    nodes: [nodeUser, nodeWeb, nodeApi, nodeAuth, nodePayment, nodeNotifier, nodeDb],
    edges,
    frames,
    markers,
    autonumber: { enabled: true, start: 1, step: 1 },
  })

  expect(generateMermaidSequence(mockViewModel(view))).toMatchSnapshot()
})
