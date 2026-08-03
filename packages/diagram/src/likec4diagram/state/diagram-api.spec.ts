import type { DiagramView, LayoutedElementView, LayoutedStoryView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { DiagramApi } from './diagram-api'
import { diagramMachine } from './machine'
import type { DiagramActorRef } from './types'

// Minimal mock views — same shape/convention as `machine.spec.ts` and
// `machine.state.navigating.spec.ts`.
const mockSceneView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:scene'),
  title: 'Scene View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-scene',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedElementView

const mockElsewhereView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:elsewhere'),
  title: 'Elsewhere View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-elsewhere',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedElementView

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
    { id: scalar.StepPath('step-01'), view: mockSceneView.id, astPath: '/a' },
  ],
  storyFlow: [],
} satisfies LayoutedStoryView

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

function createTestApi(initialView: DiagramView) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
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
  actor.send({ type: 'xyflow.init', instance: mockXYFlow })
  actor.send({
    type: 'update.view',
    view: initialView,
    source: 'external',
    xynodes: [],
    xyedges: [],
  })

  const ref = { current: actor as unknown as DiagramActorRef }
  return { actor, api: DiagramApi.withActor(ref) }
}

describe('DiagramApi.navigateTo — story interception', () => {
  it('jumps the story cursor instead of emitting navigateTo when the target is one of its own scenes', () => {
    const { actor, api } = createTestApi(mockStoryView)

    let emittedNavigateTo: string | null = null
    actor.on('navigateTo', ({ viewId }) => {
      emittedNavigateTo = viewId
    })

    api.navigateTo(mockSceneView.id)

    const story = actor.getSnapshot().children.story
    expect(story).toBeDefined()
    expect(story!.getSnapshot().context.cursor).toEqual({
      scene: mockStoryView.scenes[0]!.id,
      innerStep: null,
    })
    expect(emittedNavigateTo).toBeNull()

    actor.stop()
  })

  it('falls through to the normal navigate.to path when the target is not one of the story scenes', () => {
    const { actor, api } = createTestApi(mockStoryView)

    let emittedNavigateTo: string | null = null
    actor.on('navigateTo', ({ viewId }) => {
      emittedNavigateTo = viewId
    })

    api.navigateTo(mockElsewhereView.id)

    const story = actor.getSnapshot().children.story
    // Cursor stays at the story's first scene — untouched by the fallthrough.
    expect(story!.getSnapshot().context.cursor).toEqual({
      scene: mockStoryView.scenes[0]!.id,
      innerStep: null,
    })
    expect(emittedNavigateTo).toBe(mockElsewhereView.id)

    actor.stop()
  })

  it('behaves exactly as before when the current view is not a story (no story actor to intercept for)', () => {
    const { actor, api } = createTestApi(mockSceneView)

    let emittedNavigateTo: string | null = null
    actor.on('navigateTo', ({ viewId }) => {
      emittedNavigateTo = viewId
    })

    expect(actor.getSnapshot().children.story).toBeUndefined()

    api.navigateTo(mockElsewhereView.id)

    expect(emittedNavigateTo).toBe(mockElsewhereView.id)

    actor.stop()
  })
})
