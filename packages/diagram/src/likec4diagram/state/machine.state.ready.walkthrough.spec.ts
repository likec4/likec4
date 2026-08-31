import type { LayoutedDynamicView, NonEmptyArray, Point } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { Types } from '../types'
import { diagramMachine } from './machine'

// One step of the view, as the layouter leaves it.
const mockViewEdge = (stepnum: number) => ({
  id: scalar.EdgeId(`step-0${stepnum}`),
  parent: null,
  source: scalar.NodeId('source-node'),
  target: scalar.NodeId('target-node'),
  label: `step ${stepnum}`,
  relations: [],
  color: 'primary' as const,
  line: 'dashed' as const,
  points: [[0, 0], [100, 100]] as NonEmptyArray<Point>,
})

// Minimal mock view — `satisfies` so TypeScript validates the shape.
const mockDiagramDynamicView = {
  _type: 'dynamic' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:dynamic-diagram'),
  title: 'Diagram Dynamic View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-diagram',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [mockViewEdge(1), mockViewEdge(2)],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'diagram' as const,
  sequenceLayout: {
    actors: [],
    compounds: [],
    parallelAreas: [],
    subflows: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} satisfies LayoutedDynamicView

// The `diagram` variant renders steps as `relationship` edges,
// only the `sequence` variant renders them as `seq-step`.
// Intentional partial stub: only the fields the machine reads are set.
const mockStepEdge = (stepnum: number) =>
  ({
    id: `step-0${stepnum}`,
    type: 'relationship',
    source: 'source-node',
    target: 'target-node',
    data: {
      id: scalar.StepPath(`0${stepnum}`),
      stepnum,
      points: [[0, 0], [100, 100]],
    },
  }) as unknown as Types.Edge

// Internal nodes as ReactFlow keeps them, needed to compute the bounds of the active step.
const mockInternalNode = (id: string, x: number) => ({
  id,
  position: { x, y: 0 },
  measured: { width: 200, height: 100 },
  internals: { positionAbsolute: { x, y: 0 } },
  data: {},
})

// XYStore and XYFlow are intentional partial stubs: only the methods the machine
// actually calls are implemented, so satisfies cannot be used here.
const mockXYStore = {
  getState: () => ({
    width: 800,
    height: 600,
    transform: [0, 0, 1] as [number, number, number],
    panZoom: undefined,
    panBy: async () => false,
    resetSelectedElements: () => {},
    nodeOrigin: [0, 0] as [number, number],
    nodeLookup: new Map([
      ['source-node', mockInternalNode('source-node', 0)],
      ['target-node', mockInternalNode('target-node', 400)],
    ]),
  }),
  setState: () => {},
  subscribe: () => () => {},
} as unknown as XYStoreApi

const mockXYFlow = {
  getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  setViewport: () => Promise.resolve(true),
  getInternalNode: (_id: string) => undefined,
  flowToScreenPosition: (pt: { x: number; y: number }) => pt,
  fitView: async () => true,
} as unknown as XYFlowInstance

/**
 * Creates a test actor for the diagram machine, starts it and advances it to `ready`.
 * The actors touching the DOM are replaced with no-ops, so this runs in Node.js.
 */
function createTestActor(xyedges: Types.Edge[]) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        // mediaPrint actor uses window.addEventListener — replace with no-op for tests
        mediaPrint: fromCallback(() => () => {}),
        // hotkey actor (spawned on walkthrough entry) uses document — replace with no-op for tests
        hotkey: fromCallback(() => () => {}),
      },
    }),
    {
      input: {
        view: mockDiagramDynamicView,
        xystore: mockXYStore,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        features: DefaultFeatures,
      },
    },
  )
  actor.start()
  actor.send({ type: 'xyflow.init', instance: mockXYFlow })
  actor.send({
    type: 'update.view',
    view: mockDiagramDynamicView,
    source: 'external',
    xynodes: [],
    xyedges,
  })
  return actor
}

describe('walkthrough state - edge click', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves the walkthrough to the clicked step in a diagram-variant dynamic view', () => {
    const actor = createTestActor([mockStepEdge(1), mockStepEdge(2)])

    actor.send({ type: 'walkthrough.start', stepId: scalar.StepPath('01') })
    expect(actor.getSnapshot().context.activeWalkthrough?.stepId).toBe('step-01')

    actor.send({ type: 'xyflow.edgeClick', edge: mockStepEdge(2) })
    expect(actor.getSnapshot().context.activeWalkthrough?.stepId).toBe('step-02')

    actor.stop()
  })

  it('keeps the walkthrough on the active step when it is clicked again', () => {
    const actor = createTestActor([mockStepEdge(1), mockStepEdge(2)])

    actor.send({ type: 'walkthrough.start', stepId: scalar.StepPath('01') })
    actor.send({ type: 'xyflow.edgeClick', edge: mockStepEdge(1) })

    expect(actor.getSnapshot().context.activeWalkthrough?.stepId).toBe('step-01')

    actor.stop()
  })
})
