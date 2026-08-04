import type { AnyStoryView, ComputedStoryView } from '@likec4/core/types'
import { _type } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { currentScene, currentSceneIndex, nextScene, prevScene } from './storyScenePosition'

// Three scenes — mirrors the fixture shape the deleted story actor's own
// spec used (`packages/diagram/src/story/actor.spec.ts`), minus the dynamic
// inner-step machinery: Next/Prev only ever moved a whole scene at a time
// (the actor's own "Scene-level, deliberately" doc), so nothing behavioral is
// lost by dropping the inner-step cursor along with the actor.
const story = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'view:intro', astPath: '/a' },
    { id: 'step-02', view: 'view:middle', astPath: '/b' },
    { id: 'step-03', view: 'view:end', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

describe('currentSceneIndex', () => {
  it('finds the index of each scene by its view id', () => {
    expect(currentSceneIndex(story, 'view:intro')).toBe(0)
    expect(currentSceneIndex(story, 'view:middle')).toBe(1)
    expect(currentSceneIndex(story, 'view:end')).toBe(2)
  })

  it('returns -1 when the view is not one of the story scenes', () => {
    expect(currentSceneIndex(story, 'view:elsewhere')).toBe(-1)
  })

  it('returns -1 for a story with no flattened scenes (e.g. still at the Parsed stage)', () => {
    const parsedShaped = { [_type]: 'story', statements: [] } as unknown as AnyStoryView
    expect(currentSceneIndex(parsedShaped, 'view:intro')).toBe(-1)
  })
})

describe('currentScene', () => {
  it('returns the scene showing the current view', () => {
    expect(currentScene(story, 'view:middle')).toEqual(story.scenes[1])
  })

  it('returns null when the view is not one of the story scenes', () => {
    expect(currentScene(story, 'view:elsewhere')).toBeNull()
  })
})

describe('prevScene', () => {
  it('returns null at the first scene', () => {
    expect(prevScene(story, 'view:intro')).toBeNull()
  })

  it('returns the preceding scene in the middle of the story', () => {
    expect(prevScene(story, 'view:middle')).toEqual(story.scenes[0])
    expect(prevScene(story, 'view:end')).toEqual(story.scenes[1])
  })

  it('returns null when the view is not one of the story scenes', () => {
    expect(prevScene(story, 'view:elsewhere')).toBeNull()
  })
})

describe('nextScene', () => {
  it('returns null at the last scene', () => {
    expect(nextScene(story, 'view:end')).toBeNull()
  })

  it('returns the following scene in the middle of the story', () => {
    expect(nextScene(story, 'view:intro')).toEqual(story.scenes[1])
    expect(nextScene(story, 'view:middle')).toEqual(story.scenes[2])
  })

  it('returns null when the view is not one of the story scenes', () => {
    expect(nextScene(story, 'view:elsewhere')).toBeNull()
  })
})
