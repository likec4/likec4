import { scalar } from '@likec4/core/types'
import { describe, expect, it, vi } from 'vitest'
import { createActor, fromPromise, waitFor } from 'xstate'
import { shouldWaitForViewSync } from '../LikeC4EditorCallbacks'
import { editorActorLogic } from './machine'
import type { EditorCalls } from './setup'

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

describe('editor sync queue', () => {
  it('preserves synchronization unless a callback explicitly opts out', () => {
    expect(shouldWaitForViewSync()).toBe(true)
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
})
