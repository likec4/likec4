import type { ResolveSceneView } from '@likec4/core'
import { _type } from '@likec4/core/types'
import type { ComputedStoryView } from '@likec4/core/types'
import { StepPath } from '@likec4/core/types'
import { StoryFlow } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { createActor } from 'xstate'
import { storyActorLogic } from './actor'

// Mirrors the fixture in `packages/core/src/story/cursor.spec.ts`: three
// scenes, the middle one a dynamic view with two of its own steps.
const SCENE_1 = StepPath(1)
const SCENE_2 = StepPath(2)
const SCENE_3 = StepPath(3)
const INNER_1 = StepPath(11)
const INNER_2 = StepPath(12)

const storyView = {
  [_type]: 'story',
  scenes: [
    { id: SCENE_1, view: 'static1', astPath: '/a' },
    { id: SCENE_2, view: 'dyn', astPath: '/b' },
    { id: SCENE_3, view: 'static2', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

const resolve: ResolveSceneView = viewId =>
  viewId === 'dyn'
    ? ({
      id: 'dyn',
      flow: [INNER_1, INNER_2],
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [
        { id: INNER_1, source: 'a', target: 'b' },
        { id: INNER_2, source: 'b', target: 'a' },
      ],
    } as any)
    : null

function start() {
  const actor = createActor(storyActorLogic, {
    input: { flow: StoryFlow.from(storyView), resolve },
  })
  actor.start()
  return actor
}

describe('storyActorLogic', () => {
  it('starts on the first scene', () => {
    const actor = start()
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_1, innerStep: null })
  })

  it('next descends into a dynamic scene and steps through it', () => {
    const actor = start()
    actor.send({ type: 'next' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_2, innerStep: INNER_1 })
    actor.send({ type: 'next' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_2, innerStep: INNER_2 })
    actor.send({ type: 'next' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_3, innerStep: null })
  })

  it('next stays put once the story is exhausted, instead of nulling the cursor', () => {
    const actor = start()
    actor.send({ type: 'next' })
    actor.send({ type: 'next' })
    actor.send({ type: 'next' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_3, innerStep: null })
    actor.send({ type: 'next' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_3, innerStep: null })
  })

  it('prev stays put before the start of the story', () => {
    const actor = start()
    actor.send({ type: 'prev' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_1, innerStep: null })
  })

  it('prev mirrors next, re-entering a dynamic scene on its last step', () => {
    const actor = start()
    actor.send({ type: 'gotoScene', sceneId: SCENE_3 })
    actor.send({ type: 'prev' })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_2, innerStep: INNER_2 })
  })

  it('gotoScene jumps directly to an arbitrary scene', () => {
    const actor = start()
    actor.send({ type: 'gotoScene', sceneId: SCENE_2 })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_2, innerStep: INNER_1 })
  })

  it('gotoScene ignores an unknown scene id, staying at the current cursor', () => {
    const actor = start()
    actor.send({ type: 'gotoScene', sceneId: StepPath(99) })
    expect(actor.getSnapshot().context.cursor).toEqual({ scene: SCENE_1, innerStep: null })
  })
})
