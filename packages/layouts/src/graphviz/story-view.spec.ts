import {
  type ComputedLikeC4ModelData,
  type ComputedStoryView,
  _stage,
  _type,
  ViewId,
} from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import { describe, it } from 'vitest'
import { FakeModel } from './__fixtures__/model'
import { layoutLikeC4Model } from './layout-model'

describe('layoutLikeC4Model with story views', () => {
  it('stamps a story as layouted, unchanged otherwise (no bounds/nodes/edges fabricated)', async ({ expect }) => {
    const storyId = ViewId('s')
    const story = {
      [_stage]: 'computed',
      [_type]: 'story',
      id: storyId,
      title: null,
      description: null,
      tags: null,
      links: null,
      sceneLayout: 'anchored',
      scenes: [{ id: 'step-01', view: 'v1', astPath: '/a' }],
      storyFlow: [],
    } as unknown as ComputedStoryView

    const computedModel = LikeC4Model.create({
      ...FakeModel,
      [_stage]: 'computed',
      views: {},
      stories: { [storyId]: story },
    } as unknown as ComputedLikeC4ModelData)

    const layouted = await layoutLikeC4Model(computedModel)

    const layoutedStory = layouted.$data.stories[storyId]
    if (!layoutedStory) {
      throw new Error('expected story to survive layoutLikeC4Model')
    }
    expect(layoutedStory[_stage]).toBe('layouted')
    // A story owns no geometry (see RFC 0001, "Layout"): layouting it is just
    // relabeling its stage, so nothing else should change and no `bounds`/`nodes`/
    // `edges` should be fabricated.
    expect(layoutedStory).toEqual({ ...story, [_stage]: 'layouted' })
    expect(layoutedStory).not.toHaveProperty('bounds')
    expect(layoutedStory).not.toHaveProperty('nodes')
    expect(layoutedStory).not.toHaveProperty('edges')
  })
})
