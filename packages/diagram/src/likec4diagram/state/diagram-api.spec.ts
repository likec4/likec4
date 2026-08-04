import type { DiagramView, LayoutedElementView } from '@likec4/core/types'
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

describe('DiagramApi.navigateTo', () => {
  // No story interception any more: `navigateTo` always sends a plain
  // `navigate.to` event, unconditionally. A story's own scenes are never
  // assigned to `context.view` (Task 1 pulled `story` out of the view
  // unions), so there is nothing here to intercept for — the decision of
  // whether a navigation should stay "inside" a story now belongs entirely to
  // the consumer (the routing layer, see Task 7), which is the only layer
  // with both router access and story-scene knowledge.
  it('always emits navigateTo, regardless of the current view', () => {
    const { actor, api } = createTestApi(mockSceneView)

    let emittedNavigateTo: string | null = null
    actor.on('navigateTo', ({ viewId }) => {
      emittedNavigateTo = viewId
    })

    api.navigateTo(mockElsewhereView.id)

    expect(emittedNavigateTo).toBe(mockElsewhereView.id)

    actor.stop()
  })
})
