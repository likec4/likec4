import { scalar } from '@likec4/core/types'
import { describe, expect, it, vi } from 'vitest'
import { type ActorRefFrom, type AnyEventObject, createActor, fromPromise, setup, waitFor } from 'xstate'
import { shouldWaitForViewSync } from '../LikeC4EditorCallbacks'
import { editorActorLogic } from './machine'
import type { EditorCalls } from './setup'
import type { EditorActorEvent } from './types'

const change = {
  op: 'change-autolayout' as const,
  layout: {
    direction: 'LR' as const,
  },
}

function createTestActor(executeChange: EditorCalls.ExecuteChange) {
  const actor = createActor(
    editorActorLogic.provide({
      actors: {
        executeChange: fromPromise(executeChange),
      },
    }),
    {
      input: {
        viewId: scalar.ViewId('test'),
      },
    },
  )
  actor.start()
  return actor
}

const stubNode = {
  id: scalar.NodeId('a'),
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  children: [],
  inEdges: [],
  outEdges: [],
}

/**
 * Runs the editor under a stub `diagram` actor, so that edits can take snapshots
 */
function createActorWithDiagram(executeChange: EditorCalls.ExecuteChange) {
  const received: AnyEventObject[] = []
  const diagramStub = setup({
    types: {
      events: {} as AnyEventObject,
    },
    actors: {
      editor: editorActorLogic.provide({
        actors: {
          executeChange: fromPromise(executeChange),
        },
      }),
    },
  }).createMachine({
    context: {
      view: {
        id: scalar.ViewId('test'),
        nodes: [stubNode],
        edges: [],
      },
      xynodes: [],
      xyedges: [],
      xystore: {
        getState: () => ({
          nodeLookup: new Map([[stubNode.id, {
            data: {},
            measured: { width: stubNode.width, height: stubNode.height },
            internals: { positionAbsolute: { x: stubNode.x, y: stubNode.y } },
          }]]),
          edgeLookup: new Map(),
        }),
      },
    },
    invoke: {
      id: 'editor',
      systemId: 'editor',
      src: 'editor',
      input: { viewId: scalar.ViewId('test') },
    },
    on: {
      '*': {
        actions: ({ event }) => received.push(event),
      },
    },
  })
  const root = createActor(diagramStub, { systemId: 'diagram' })
  root.start()
  const editor: ActorRefFrom<typeof editorActorLogic> | undefined = root.system.get('editor')
  if (!editor) {
    throw new Error('editor actor not found')
  }
  return { root, editor, received }
}

describe('editor sync queue', () => {
  it('preserves synchronization unless a callback explicitly opts out', () => {
    expect(shouldWaitForViewSync()).toBe(true)
    expect(shouldWaitForViewSync({ waitForViewSync: true })).toBe(true)
    expect(shouldWaitForViewSync({ waitForViewSync: false })).toBe(false)
  })

  it('returns to idle without waiting when the callback does not publish a refreshed view', async () => {
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: false,
    }))
    const actor = createTestActor(executeChange)

    actor.send({ type: 'change.view', change })

    await waitFor(
      actor,
      snapshot => executeChange.mock.calls.length === 1 && !snapshot.hasTag('busy'),
      { timeout: 500 },
    )
    expect(actor.getSnapshot().matches({ syncQueue: 'idle' })).toBe(true)
    actor.stop()
  })

  it('waits until the refreshed view arrives when synchronization is expected', async () => {
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: true,
    }))
    const actor = createTestActor(executeChange)

    actor.send({ type: 'change.view', change })

    await waitFor(
      actor,
      snapshot =>
        (snapshot.value as unknown as { syncQueue: { process: string } }).syncQueue.process === 'waitViewSynced',
      { timeout: 500 },
    )
    expect(actor.getSnapshot().hasTag('busy')).toBe(true)

    actor.send({ type: 'view.synched' })
    await waitFor(actor, snapshot => !snapshot.hasTag('busy'), { timeout: 500 })
    expect(actor.getSnapshot().matches({ syncQueue: 'idle' })).toBe(true)
    actor.stop()
  })

  it('does not lock editing while syncing changes', async () => {
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: true,
    }))
    const actor = createTestActor(executeChange)

    actor.send({ type: 'change.view', change })

    await waitFor(actor, snapshot => snapshot.hasTag('busy'), { timeout: 500 })
    expect(actor.getSnapshot().hasTag('locked')).toBe(false)
    actor.stop()
  })

  it('queues edits made while a sync is in progress instead of dropping them', async () => {
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: true,
    }))
    const actor = createTestActor(executeChange)

    actor.send({ type: 'change.view', change })
    await waitFor(
      actor,
      snapshot =>
        (snapshot.value as unknown as { syncQueue: { process: string } }).syncQueue.process === 'waitViewSynced',
      { timeout: 500 },
    )

    actor.send({ type: 'change.sync-snapshot' })

    expect(actor.getSnapshot().hasTag('busy')).toBe(true)
    expect(actor.getSnapshot().context.syncQueue).toEqual(['sync-snapshot'])
    actor.stop()
  })

  it.each<[string, EditorActorEvent]>(
    [
      ['delete.nodes-edges', { type: 'delete.nodes-edges', nodeIds: [], edgeIds: [] }],
      ['undo', { type: 'undo' }],
    ],
  )('applies and queues %s received while a sync is in progress', async (_, event) => {
    const executeChange = vi.fn<EditorCalls.ExecuteChange>(async ({ input }) => ({
      requested: input.changes,
      applied: input.changes,
      waitForViewSync: true,
    }))
    const { root, editor, received } = createActorWithDiagram(executeChange)

    // Create history entry for undo
    editor.send({ type: 'edit.move.start', subject: 'node' })
    editor.send({ type: 'edit.move.end' })
    editor.send({ type: 'change.view', change })
    await waitFor(
      editor,
      snapshot =>
        (snapshot.value as unknown as { syncQueue: { process: string } }).syncQueue.process === 'waitViewSynced',
      { timeout: 500 },
    )
    received.length = 0

    editor.send(event)

    // Local view is updated immediately
    expect(received).toContainEqual(expect.objectContaining({ type: 'update.view', source: 'editor' }))
    expect(editor.getSnapshot().context.unsynced).toBe(true)

    // Scheduled sync snapshot is queued, not dropped
    await waitFor(editor, snapshot => snapshot.context.syncQueue.includes('sync-snapshot'), { timeout: 500 })

    // After current sync completes, queued snapshot is processed
    editor.send({ type: 'view.synched' })
    await waitFor(editor, () => executeChange.mock.calls.length === 2, { timeout: 500 })
    expect(executeChange.mock.calls[1]![0].input.changes).toContainEqual(
      expect.objectContaining({ op: 'save-view-snapshot' }),
    )
    root.stop()
  })
})
