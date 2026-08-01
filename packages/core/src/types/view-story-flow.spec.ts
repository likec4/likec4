import { describe, expect, it } from 'vitest'
import { _type } from './const'
import { StepPath } from './scalar'
import type { ComputedStoryView } from './view-computed'
import { StoryFlow } from './view-story-flow'

const SCENE_1 = StepPath(1) // 'step-01'
const SCENE_2 = StepPath([2, 'alt'], [1, 'when'], 1) // 'step-02:alt.01:when.01'
const SCENE_3 = StepPath([2, 'alt'], [2, 'else'], 1) // 'step-02:alt.02:else.01'
const UNKNOWN = StepPath(99) // 'step-99' — not a scene in this story

const view = {
  [_type]: 'story',
  scenes: [
    { id: SCENE_1, view: 'v1', astPath: '/a' },
    { id: SCENE_2, view: 'v2', astPath: '/b' },
    { id: SCENE_3, view: 'v3', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

describe('StoryFlow', () => {
  it('returns the first and last scenes', () => {
    const flow = StoryFlow.from(view)
    expect(flow.firstScene()).toBe(SCENE_1)
    expect(flow.lastScene()).toBe(SCENE_3)
  })

  it('walks depth-first through alt branches', () => {
    const flow = StoryFlow.from(view)
    expect(flow.prevAndNext(SCENE_1)).toEqual({
      prev: null,
      next: SCENE_2,
    })
    expect(flow.prevAndNext(SCENE_2)).toEqual({
      prev: SCENE_1,
      next: SCENE_3,
    })
    expect(flow.prevAndNext(SCENE_3)).toEqual({
      prev: SCENE_2,
      next: null,
    })
  })

  it('looks a scene up by path', () => {
    expect(StoryFlow.from(view).lookup(SCENE_2)?.view).toBe('v2')
  })

  it('returns nulls for an unknown path', () => {
    expect(StoryFlow.from(view).prevAndNext(UNKNOWN)).toEqual({ prev: null, next: null })
  })

  it('caches per view instance', () => {
    expect(StoryFlow.from(view)).toBe(StoryFlow.from(view))
  })
})
