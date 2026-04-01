import type { DiagramView } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'

// Minimal mock views
const mockElementView = {
  _type: 'element',
  _stage: 'layouted',
  id: 'view:element',
  title: 'Element View',
  description: null,
  tags: null,
  links: null,
  notation: null,
  rules: [],
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} as unknown as DiagramView

const mockDiagramDynamicView = {
  _type: 'dynamic',
  _stage: 'layouted',
  id: 'view:dynamic-diagram',
  title: 'Diagram Dynamic View',
  description: null,
  tags: null,
  links: null,
  notation: null,
  rules: [],
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'diagram',
  sequenceLayout: {
    actors: [],
    compounds: [],
    parallelAreas: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} as unknown as DiagramView

const mockSequenceDynamicView = {
  _type: 'dynamic',
  _stage: 'layouted',
  id: 'view:dynamic-sequence',
  title: 'Sequence Dynamic View',
  description: null,
  tags: null,
  links: null,
  notation: null,
  rules: [],
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'sequence',
  sequenceLayout: {
    actors: [],
    compounds: [],
    parallelAreas: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} as unknown as DiagramView

const mockXYStore = {
  getState: () => ({
    width: 800,
    height: 600,
    transform: [0, 0, 1] as [number, number, number],
    panZoom: undefined,
    panBy: async () => false,
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
 * Creates a test actor for the diagram machine.
 * Overrides mediaPrintActorLogic with a no-op to avoid window.addEventListener in Node.js.
 */
function createTestActor(initialView: DiagramView) {
  return createActor(
    diagramMachine.provide({
      actors: {
        // mediaPrintActorLogic uses window.addEventListener — replace with no-op for tests
        mediaPrintActorLogic: fromCallback(() => () => {}),
      },
    }),
    {
      input: {
        view: initialView,
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
}

/**
 * Advances the machine from `initializing` to `ready` state by sending the two
 * events required by the initializing state: xyflow.init and update.view.
 */
function advanceToReady(actor: ReturnType<typeof createTestActor>, view: DiagramView) {
  actor.send({ type: 'xyflow.init', instance: mockXYFlow })
  actor.send({
    type: 'update.view',
    view,
    source: 'external',
    xynodes: [],
    xyedges: [],
  })
}

describe('navigating state - dynamicViewVariant', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets dynamicViewVariant to "sequence" when navigating from a non-dynamic view', () => {
    const actor = createTestActor(mockElementView)
    actor.start()

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('diagram')

    advanceToReady(actor, mockElementView)

    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('sets dynamicViewVariant to "sequence" when navigating from a diagram-variant dynamic view', () => {
    const actor = createTestActor(mockDiagramDynamicView)
    actor.start()

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('diagram')

    advanceToReady(actor, mockDiagramDynamicView)

    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('initializes dynamicViewVariant from the view variant on first load (sequence)', () => {
    const actor = createTestActor(mockSequenceDynamicView)
    actor.start()

    // Machine initializes context.dynamicViewVariant from input.view.variant
    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('restores dynamicViewVariant to "sequence" when navigating back to a sequence view', () => {
    const actor = createTestActor(mockElementView)
    actor.start()
    advanceToReady(actor, mockElementView)

    // First navigation to sequence view
    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })
    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    // Navigate away to element view
    actor.send({
      type: 'update.view',
      view: mockElementView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    // Navigate back to sequence view — history restore path
    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })
})
