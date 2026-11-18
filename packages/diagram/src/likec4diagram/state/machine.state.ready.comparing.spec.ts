import type { LayoutedDynamicView, LayoutedElementView, LayoutedViewDriftReason, LayoutType } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback, fromPromise } from 'xstate'
import { type EnabledFeatures, DefaultFeatures } from '../../context/DiagramFeatures'
import { editorActorLogic } from '../../editor/actor/machine'
import type { EditorCalls } from '../../editor/actor/setup'
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
const mockXYStore = (selectedNodeIds: string[], view: LayoutedElementView | LayoutedDynamicView) =>
  ({
    getState: () => ({
      width: 800,
      height: 600,
      transform: [0, 0, 1] as [number, number, number],
      panZoom: undefined,
      panBy: async () => false,
      resetSelectedElements: () => {},
      nodeOrigin: [0, 0] as [number, number],
      nodeLookup: new Map([...new Set([...selectedNodeIds, ...view.nodes.map(n => n.id)])].map(id => {
        const node = view.nodes.find(n => n.id === id)
        return [id, {
          id,
          selected: selectedNodeIds.includes(id),
          data: node ?? {},
          measured: { width: node?.width ?? 100, height: node?.height ?? 100 },
          internals: { positionAbsolute: { x: node?.x ?? 0, y: node?.y ?? 0 } },
        }]
      })),
      parentLookup: new Map(),
    }),
    setState: () => {},
    subscribe: () => () => {},
  }) as unknown as XYStoreApi

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
function createTestActor(
  view: LayoutedElementView | LayoutedDynamicView = mockView(),
  selectedNodeIds: string[] = [],
  editorLogic = editorActorLogic,
) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        editor: editorLogic,
        mediaPrint: fromCallback(() => () => {}),
        hotkey: fromCallback(() => () => {}),
      },
    }),
    {
      systemId: 'diagram',
      input: {
        view,
        xystore: mockXYStore(selectedNodeIds, view),
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

  it('remembers viewport of the auto layout, when switching to manual', () => {
    const { actor, layoutTypeChanges } = createTestActor()
    actor.send({ type: 'compare.start' })
    switchLayout(actor, 'auto')

    actor.send({ type: 'emit.onLayoutTypeChange', layoutType: 'manual' })

    expect(actor.getSnapshot().context.viewportOnAutoLayout).toEqual(actor.getSnapshot().context.viewport)
    expect(layoutTypeChanges).toEqual(['auto', 'manual'])
    actor.stop()
  })

  it('does not remember layout viewports when switching outside of comparing', () => {
    const { actor, layoutTypeChanges } = createTestActor()

    switchLayout(actor, 'auto')
    switchLayout(actor, 'manual')

    expect(isComparing(actor)).toBe(false)
    expect(actor.getSnapshot().context.viewportOnManualLayout).toBeNull()
    expect(actor.getSnapshot().context.viewportOnAutoLayout).toBeNull()
    expect(layoutTypeChanges).toEqual(['auto', 'manual'])
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
    const { actor } = createTestActor(mockView(), ['first', 'second'])
    actor.send({ type: 'compare.start' })

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(false)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(true)

    switchLayout(actor, 'auto')

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(true)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(false)

    switchLayout(actor, 'manual')

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(false)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(true)
    actor.stop()
  })

  it('auto layout outside of comparing does not force readonly', () => {
    const { actor } = createTestActor(mockView({ layout: 'auto' }), ['first', 'second'])

    expect(deriveToggledFeatures(actor.getSnapshot()).enableReadOnly).toBe(false)
    expect(actor.getSnapshot().can({ type: 'layout.align', mode: 'Left' })).toBe(true)
    actor.stop()
  })

  it('applies the editor latest layout while unsynced and saves the updated diagram', async () => {
    const view = {
      ...mockView(),
      nodes: [{
        id: scalar.NodeId('a'),
        modelRef: scalar.Fqn('a'),
        parent: null,
        children: [],
        inEdges: [],
        outEdges: [],
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        labelBBox: { x: 0, y: 0, width: 100, height: 24 },
        kind: 'component',
        title: 'A',
        description: null,
        technology: null,
        color: 'primary',
        shape: 'rectangle',
        style: {},
        level: 0,
        tags: [],
      }],
    } satisfies LayoutedElementView
    const updated = { ...view, hash: 'applied-latest' }
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: false,
    }))
    const { actor } = createTestActor(
      view,
      [],
      editorActorLogic.provide({
        actors: {
          hotkey: fromCallback(() => () => {}),
          applyLatest: fromPromise<EditorCalls.ApplyLatestToManual.Output, EditorCalls.ApplyLatestToManual.Input>(
            async () => ({ updated }),
          ),
          executeChange: fromPromise(executeChange),
        },
      }),
    )
    try {
      actor.send({ type: 'update.features', features: { ...features, enableEditor: true } })
      const editor = actor.getSnapshot().children.editor
      if (!editor) {
        throw new Error('editor actor not found')
      }
      editor.send({ type: 'edit.move.start', subject: 'node' })
      editor.send({ type: 'edit.move.end' })
      expect(editor.getSnapshot().context.unsynced).toBe(true)

      editor.send({ type: 'change.latest-to-manual' })
      actor.send({
        type: 'update.view',
        source: 'external',
        view: { ...mockView(), hash: 'stale-external' },
        xynodes: [],
        xyedges: [],
      })
      expect(actor.getSnapshot().context.view.hash).toBe(mockView().hash)

      await vi.advanceTimersByTimeAsync(20)

      expect(actor.getSnapshot().context.view.hash).toBe(updated.hash)
      expect(editor.getSnapshot().context.unsynced).toBe(true)

      await vi.advanceTimersByTimeAsync(2_000)

      expect(executeChange).toHaveBeenCalledTimes(1)
      expect(executeChange.mock.calls[0]![0].input.changes).toContainEqual(
        expect.objectContaining({
          op: 'save-view-snapshot',
          layout: expect.objectContaining({ hash: updated.hash }),
        }),
      )
      expect(editor.getSnapshot().context.unsynced).toBe(false)
    } finally {
      actor.stop()
    }
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
