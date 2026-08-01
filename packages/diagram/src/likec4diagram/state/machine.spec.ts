import type { StoryCursor } from '@likec4/core'
import type { DiagramView, LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { fromCallback } from 'xstate'
import { createActor } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'

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
  nodes: [
    {
      id: 'shared',
      modelRef: 'shared',
      title: 'Shared',
      parent: null,
      children: [],
      inEdges: [],
      outEdges: [],
      tags: [],
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      kind: 'el',
      color: 'primary',
      shape: 'rectangle',
      style: {},
      level: 0,
      labelBBox: { x: 0, y: 0, width: 0, height: 0 },
    },
  ],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} as unknown as LayoutedElementView

// A different scene's view — same shared node, plus one that's new to this scene.
const mockSceneView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:scene-2'),
  title: 'Scene 2',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-scene-2',
  autoLayout: { direction: 'TB' as const },
  nodes: [
    {
      id: 'shared',
      modelRef: 'shared',
      title: 'Shared',
      parent: null,
      children: [],
      inEdges: [],
      outEdges: [],
      tags: [],
      x: 100,
      y: 0,
      width: 10,
      height: 10,
      kind: 'el',
      color: 'primary',
      shape: 'rectangle',
      style: {},
      level: 0,
      labelBBox: { x: 0, y: 0, width: 0, height: 0 },
    },
    {
      id: 'new-in-scene-2',
      modelRef: 'new-in-scene-2',
      title: 'New',
      parent: null,
      children: [],
      inEdges: [],
      outEdges: [],
      tags: [],
      x: 140,
      y: 0,
      width: 10,
      height: 10,
      kind: 'el',
      color: 'primary',
      shape: 'rectangle',
      style: {},
      level: 0,
      labelBBox: { x: 0, y: 0, width: 0, height: 0 },
    },
  ],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} as unknown as LayoutedElementView

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

function createTestActor(initialView: DiagramView) {
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
  return actor
}

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

describe('story.scene', () => {
  const cursor: StoryCursor = { scene: scalar.StepPath('step-01'), innerStep: null }

  it('merges the resolved scene by node id and records the cursor', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    actor.send({ type: 'story.scene', cursor, view: mockSceneView })

    const { context } = actor.getSnapshot()
    expect(context.activeStoryCursor).toEqual(cursor)
    expect(context.view.id).toBe(mockSceneView.id)
    expect(context.xynodes.map(n => n.id).sort()).toEqual(['new-in-scene-2', 'shared'])

    actor.stop()
  })

  it('does not push navigationHistory, unlike update.view', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    const historyBefore = actor.getSnapshot().context.navigationHistory

    actor.send({ type: 'story.scene', cursor, view: mockSceneView })

    const historyAfter = actor.getSnapshot().context.navigationHistory
    expect(historyAfter).toBe(historyBefore)
    expect(historyAfter.history.some(entry => entry.viewId === mockSceneView.id)).toBe(false)

    actor.stop()
  })

  it('contrasts with update.view, which does push navigationHistory for a differing view id', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    const historyBefore = actor.getSnapshot().context.navigationHistory.history.length

    actor.send({
      type: 'update.view',
      view: mockSceneView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    const historyAfter = actor.getSnapshot().context.navigationHistory.history.length
    expect(historyAfter).toBe(historyBefore + 1)

    actor.stop()
  })
})
