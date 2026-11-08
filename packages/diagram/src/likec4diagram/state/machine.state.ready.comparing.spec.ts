import type { LayoutedDynamicView, LayoutedElementView, LayoutedViewDriftReason, LayoutType } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { type EnabledFeatures, DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'
import { deriveToggledFeatures, isComparingLayouts } from './machine.setup'

type Drifts = readonly [LayoutedViewDriftReason, ...LayoutedViewDriftReason[]]

const mockView = ({
  id = 'view',
  layout = 'manual',
  drifts = ['nodes-added'],
}: {
  id?: string
  layout?: LayoutType
  drifts?: Drifts | null
} = {}) =>
  ({
    _type: 'element',
    _stage: 'layouted',
    _layout: layout,
    id: scalar.ViewId(id),
    title: 'View',
    description: null,
    tags: null,
    links: null,
    hash: `hash-${id}-${layout}`,
    autoLayout: { direction: 'TB' },
    nodes: [],
    edges: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    drifts,
  }) satisfies LayoutedElementView

const mockDynamicView = {
  ...mockView(),
  _type: 'dynamic',
  variant: 'diagram',
  sequenceLayout: {
    actors: [],
    compounds: [],
    parallelAreas: [],
    subflows: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} satisfies LayoutedDynamicView

// XYStore and XYFlow are intentional partial stubs:
// only the methods the machine actually calls are implemented
const mockXYStore = {
  getState: () => ({
    width: 800,
    height: 600,
    transform: [0, 0, 1] as [number, number, number],
    panZoom: undefined,
    panBy: async () => false,
    resetSelectedElements: () => {},
    nodeOrigin: [0, 0] as [number, number],
    nodeLookup: new Map(),
    parentLookup: new Map(),
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

const features: EnabledFeatures = {
  ...DefaultFeatures,
  enableCompareWithLatest: true,
  enableReadOnly: false,
}

/**
 * Creates a test actor for the diagram machine, starts it and advances it to `ready`.
 * The actors touching the DOM are replaced with no-ops, so this runs in Node.js.
 */
function createTestActor(view: LayoutedElementView | LayoutedDynamicView = mockView()) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        mediaPrint: fromCallback(() => () => {}),
        hotkey: fromCallback(() => () => {}),
      },
    }),
    {
      input: {
        view,
        xystore: mockXYStore,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        features,
      },
    },
  )
  const layoutTypeChanges: LayoutType[] = []
  actor.on('onLayoutTypeChange', ({ layoutType }) => {
    layoutTypeChanges.push(layoutType)
  })
  actor.start()
  actor.send({ type: 'xyflow.init', instance: mockXYFlow })
  actor.send({ type: 'update.view', view, source: 'external', xynodes: [], xyedges: [] })
  // Editing is allowed, unless forced by the diagram state
  actor.send({ type: 'toggle.feature', feature: 'ReadOnly', forceValue: false })
  return { actor, layoutTypeChanges }
}

/**
 * Simulates the consumer, that applies the layout type change
 */
function switchLayout(actor: ReturnType<typeof createTestActor>['actor'], layout: LayoutType) {
  actor.send({ type: 'emit.onLayoutTypeChange', layoutType: layout })
  actor.send({ type: 'update.view', view: mockView({ layout }), xynodes: [], xyedges: [] })
}

const isComparing = (actor: ReturnType<typeof createTestActor>['actor']) => isComparingLayouts(actor.getSnapshot())

describe('ready.comparing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('enters comparing on compare.start, if view has drifts', () => {
    const { actor } = createTestActor()

    actor.send({ type: 'compare.start' })

    expect(actor.getSnapshot().matches({ ready: 'comparing' })).toBe(true)
    expect(isComparing(actor)).toBe(true)
    actor.stop()
  })

  it('ignores compare.start, if view has no drifts', () => {
    const { actor } = createTestActor(mockView({ drifts: null }))

    actor.send({ type: 'compare.start' })

    expect(actor.getSnapshot().matches({ ready: 'idle' })).toBe(true)
    expect(isComparing(actor)).toBe(false)
    actor.stop()
  })

  it('ignores compare.start, if feature is disabled', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'update.features', features: { ...features, enableCompareWithLatest: false } })

    actor.send({ type: 'compare.start' })

    expect(isComparing(actor)).toBe(false)
    actor.stop()
  })

  it('leaves comparing on compare.end, without layout change in manual layout', () => {
    const { actor, layoutTypeChanges } = createTestActor()
    actor.send({ type: 'compare.start' })

    actor.send({ type: 'compare.end' })

    expect(actor.getSnapshot().matches({ ready: 'idle' })).toBe(true)
    expect(layoutTypeChanges).toEqual([])
    actor.stop()
  })

  it('switches back to manual layout on compare.end in auto layout', () => {
    const { actor, layoutTypeChanges } = createTestActor()
    actor.send({ type: 'compare.start' })
    switchLayout(actor, 'auto')
    expect(isComparing(actor)).toBe(true)

    actor.send({ type: 'compare.end' })

    expect(isComparing(actor)).toBe(false)
    expect(layoutTypeChanges).toEqual(['auto', 'manual'])
    expect(actor.getSnapshot().context.viewportOnAutoLayout).toBeNull()
    expect(actor.getSnapshot().context.viewportOnManualLayout).toBeNull()
    actor.stop()
  })

  it('remembers viewport of the manual layout, when switching to auto', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'compare.start' })

    actor.send({ type: 'emit.onLayoutTypeChange', layoutType: 'auto' })

    expect(actor.getSnapshot().context.viewportOnManualLayout).toEqual(actor.getSnapshot().context.viewport)
    expect(actor.getSnapshot().context.viewportOnAutoLayout).toBeNull()
    actor.stop()
  })

  it('leaves comparing automatically when drifts are gone', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'compare.start' })

    actor.send({ type: 'update.view', view: mockView({ drifts: null }), xynodes: [], xyedges: [] })

    expect(actor.getSnapshot().matches({ ready: 'idle' })).toBe(true)
    actor.stop()
  })

  it('leaves comparing automatically when feature is disabled', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'compare.start' })

    actor.send({ type: 'update.features', features: { ...features, enableCompareWithLatest: false } })

    expect(isComparing(actor)).toBe(false)
    actor.stop()
  })

  it('ignores walkthrough.start', () => {
    const { actor } = createTestActor(mockDynamicView)
    // walkthrough is available outside of comparing
    expect(actor.getSnapshot().can({ type: 'walkthrough.start' })).toBe(true)
    actor.send({ type: 'compare.start' })
    expect(actor.getSnapshot().can({ type: 'walkthrough.start' })).toBe(false)

    actor.send({ type: 'walkthrough.start' })

    expect(actor.getSnapshot().matches({ ready: 'comparing' })).toBe(true)
    actor.stop()
  })

  it('ignores focus.node', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'compare.start' })

    actor.send({ type: 'focus.node', nodeId: scalar.NodeId('node'), autoUnfocus: true })

    expect(actor.getSnapshot().matches({ ready: 'comparing' })).toBe(true)
    actor.stop()
  })

  it('is readonly in auto layout, and editable in manual layout', () => {
    const { actor } = createTestActor()
    actor.send({ type: 'compare.start' })

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(false)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(true)

    switchLayout(actor, 'auto')

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(true)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(false)
    actor.stop()
  })

  it('auto layout outside of comparing does not force readonly', () => {
    const { actor } = createTestActor(mockView({ layout: 'auto' }))

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(false)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(true)
    actor.stop()
  })

  it('leaves comparing and switches back to manual layout on navigation', () => {
    const { actor, layoutTypeChanges } = createTestActor()
    actor.send({ type: 'compare.start' })
    switchLayout(actor, 'auto')

    actor.send({
      type: 'update.view',
      view: mockView({ id: 'another-view' }),
      xynodes: [],
      xyedges: [],
    })

    expect(isComparing(actor)).toBe(false)
    expect(actor.getSnapshot().context.view.id).toBe('another-view')
    expect(layoutTypeChanges).toEqual(['auto', 'manual'])
    actor.stop()
  })
})
