import type { DiagramView, LayoutedDynamicView, LayoutedElementView, LayoutedStoryView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'

// Minimal mock views — use `satisfies` so TypeScript validates the shapes.
// `scalar.ViewId()` is required because the `id` field is a branded type.
const mockElementView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:element'),
  title: 'Element View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-element',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedElementView

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
  edges: [],
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

const mockSequenceDynamicView = {
  _type: 'dynamic' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:dynamic-sequence'),
  title: 'Sequence Dynamic View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-sequence',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'sequence' as const,
  sequenceLayout: {
    actors: [],
    compounds: [],
    subflows: [],
    parallelAreas: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} satisfies LayoutedDynamicView

const mockStoryView = {
  _type: 'story' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:story'),
  title: 'Story View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-story',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  sceneLayout: 'anchored' as const,
  scenes: [
    { id: scalar.StepPath('step-01'), view: scalar.ViewId('view:element'), astPath: '/a' },
  ],
  storyFlow: [],
} satisfies LayoutedStoryView

// A second, distinct story (different id and scenes) — used to verify a
// mid-session move from one story straight into another respawns the actor
// with a fresh flow, rather than reusing the first story's.
const mockOtherStoryView = {
  _type: 'story' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:other-story'),
  title: 'Other Story View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-other-story',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  sceneLayout: 'anchored' as const,
  scenes: [
    { id: scalar.StepPath('step-01'), view: scalar.ViewId('view:dynamic-diagram'), astPath: '/a' },
  ],
  storyFlow: [],
} satisfies LayoutedStoryView

// XYStore and XYFlow are intentional partial stubs: only the methods the machine
// actually calls are implemented, so satisfies cannot be used here.
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
 * Creates a test actor for the diagram machine and starts it.
 * Overrides mediaPrintActorLogic with a no-op to avoid window.addEventListener in Node.js.
 */
function createTestActor(initialView: DiagramView) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        // mediaPrint actor uses window.addEventListener — replace with no-op for tests
        mediaPrint: fromCallback(() => () => {}),
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
  actor.start()
  return actor
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

    // Machine initializes context.dynamicViewVariant from input.view.variant
    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('restores dynamicViewVariant to "sequence" when navigating back to a sequence view', () => {
    const actor = createTestActor(mockElementView)
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

describe('navigating state - story actor lifecycle', () => {
  it('spawns the story actor when navigating into a story mid-session', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    expect(actor.getSnapshot().children.story).toBeUndefined()

    actor.send({
      type: 'update.view',
      view: mockStoryView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    const story = actor.getSnapshot().children.story
    expect(story).toBeDefined()
    expect(story!.getSnapshot().context.flow.scenes.map(s => s.id)).toEqual(
      mockStoryView.scenes.map(s => s.id),
    )
    expect(story!.getSnapshot().context.cursor).toEqual({ scene: mockStoryView.scenes[0]!.id, innerStep: null })

    actor.stop()
  })

  it('stops the story actor and clears activeStoryCursor when navigating away from a story', () => {
    // Root-level `entry:` (`machine.ts`) spawns the story actor directly when
    // mounted on a story view — this exercises that path as the starting
    // point, then confirms the *reverse* direction of mid-session entry.
    const actor = createTestActor(mockStoryView)
    advanceToReady(actor, mockStoryView)
    expect(actor.getSnapshot().children.story).toBeDefined()

    // Simulate the canvas having actually rendered a scene (the dispatch link
    // in `DiagramActorProvider.tsx`). This is what `context.view` looks like
    // for almost the entire lifetime of a story session in practice —
    // `story.scene` overwrites it with the scene's own view, not the story
    // wrapper — which is exactly why `syncStoryActor` cannot key off
    // `context.view._type === 'story'` to detect "a story is active".
    actor.send({
      type: 'story.scene',
      cursor: { scene: mockStoryView.scenes[0]!.id, innerStep: null },
      view: mockElementView,
    })
    expect(actor.getSnapshot().context.activeStoryCursor).not.toBeNull()
    expect(actor.getSnapshot().context.view.id).toBe(mockElementView.id)
    expect(actor.getSnapshot().context.view._type).not.toBe('story')

    // Now navigate to a *third*, unrelated view — a real "leave the story"
    // transition, distinct from the scene view already showing.
    actor.send({
      type: 'update.view',
      view: mockDiagramDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().children.story).toBeUndefined()
    expect(actor.getSnapshot().context.activeStoryCursor).toBeNull()

    actor.stop()
  })

  it('respawns with a fresh flow when navigating from one story straight into another', () => {
    const actor = createTestActor(mockStoryView)
    advanceToReady(actor, mockStoryView)

    const firstStory = actor.getSnapshot().children.story
    expect(firstStory).toBeDefined()

    actor.send({
      type: 'update.view',
      view: mockOtherStoryView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    const secondStory = actor.getSnapshot().children.story
    expect(secondStory).toBeDefined()
    expect(secondStory).not.toBe(firstStory)
    expect(secondStory!.getSnapshot().context.flow.scenes.map(s => s.id)).toEqual(
      mockOtherStoryView.scenes.map(s => s.id),
    )

    actor.stop()
  })
})
