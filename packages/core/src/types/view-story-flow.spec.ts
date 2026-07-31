import { describe, expect, it } from 'vitest'
import { _type } from './const'
import type { ComputedStoryView } from './view-computed'
import { StoryFlow } from './view-story-flow'

const view = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'v1', astPath: '/a' },
    { id: 'step-02:alt.01:when.01', view: 'v2', astPath: '/b' },
    { id: 'step-02:alt.02:else.01', view: 'v3', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

describe('StoryFlow', () => {
  it('returns the first and last scenes', () => {
    const flow = StoryFlow.from(view)
    expect(flow.firstScene()).toBe('step-01')
    expect(flow.lastScene()).toBe('step-02:alt.02:else.01')
  })

  it('walks depth-first through alt branches', () => {
    const flow = StoryFlow.from(view)
    expect(flow.prevAndNext('step-01')).toEqual({
      prev: null,
      next: 'step-02:alt.01:when.01',
    })
    expect(flow.prevAndNext('step-02:alt.01:when.01')).toEqual({
      prev: 'step-01',
      next: 'step-02:alt.02:else.01',
    })
    expect(flow.prevAndNext('step-02:alt.02:else.01')).toEqual({
      prev: 'step-02:alt.01:when.01',
      next: null,
    })
  })

  it('looks a scene up by path', () => {
    expect(StoryFlow.from(view).lookup('step-02:alt.01:when.01')?.view).toBe('v2')
  })

  it('returns nulls for an unknown path', () => {
    expect(StoryFlow.from(view).prevAndNext('step-99')).toEqual({ prev: null, next: null })
  })

  it('caches per view instance', () => {
    expect(StoryFlow.from(view)).toBe(StoryFlow.from(view))
  })
})
