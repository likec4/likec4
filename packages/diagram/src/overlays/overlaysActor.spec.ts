import type { DiagramView } from '@likec4/core'
import { nonNullable, scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { overlaysActorLogic } from './overlaysActor'

const currentView = {
  _type: 'element',
  _stage: 'layouted',
  id: scalar.ViewId('index'),
  title: 'Index',
  description: null,
  tags: null,
  links: null,
  hash: 'index',
  autoLayout: { direction: 'TB' },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies DiagramView

function startOverlays() {
  const actor = createActor(
    overlaysActorLogic.provide({
      actors: {
        hotkey: fromCallback(() => () => {}),
      },
    }),
    { input: {} as never },
  ).start()
  actor.send({
    type: 'open.elementDetails',
    subject: { type: 'element', element: scalar.Fqn('cloud') },
    currentView,
    initiatedFrom: {
      node: scalar.NodeId('cloud'),
      clientRect: { x: 10, y: 20, width: 100, height: 50 },
    },
  })
  const overlay = nonNullable(actor.getSnapshot().context.overlays[0])
  return { actor, actorId: overlay.id }
}

describe('overlays: change.elementDetails', () => {
  it('replaces the subject of the open card instead of opening another one', () => {
    const { actor, actorId } = startOverlays()

    actor.send({
      type: 'change.elementDetails',
      actorId,
      subject: { type: 'element', element: scalar.Fqn('cloud.api') },
    })

    const { overlays } = actor.getSnapshot().context
    expect(overlays).toEqual([
      { id: actorId, type: 'elementDetails', subject: { type: 'element', element: 'cloud.api' } },
    ])
    const card = nonNullable(actor.getSnapshot().children[actorId as `elementDetails-${number}`])
    expect(card.getSnapshot().context.subject).toEqual({ type: 'element', element: 'cloud.api' })
    // The card is no longer related to the node it was opened from, but keeps its position
    expect(card.getSnapshot().context.initiatedFrom).toEqual({
      node: null,
      clientRect: { x: 10, y: 20, width: 100, height: 50 },
    })
    actor.stop()
  })

  it('allows opening the previous subject again after replacing it', () => {
    const { actor, actorId } = startOverlays()
    actor.send({
      type: 'change.elementDetails',
      actorId,
      subject: { type: 'element', element: scalar.Fqn('cloud.api') },
    })
    actor.send({
      type: 'open.elementDetails',
      subject: { type: 'element', element: scalar.Fqn('cloud') },
      currentView,
    })
    expect(actor.getSnapshot().context.overlays).toHaveLength(2)
    actor.stop()
  })

  it('ignores unknown overlays', () => {
    const { actor } = startOverlays()
    const before = actor.getSnapshot().context
    actor.send({
      type: 'change.elementDetails',
      actorId: 'elementDetails-999',
      subject: { type: 'element', element: scalar.Fqn('cloud.api') },
    })
    expect(actor.getSnapshot().context).toBe(before)
    actor.stop()
  })
})
