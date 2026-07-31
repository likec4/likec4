import { type ComputedStoryView, _stage, _type, isStoryView, ViewId } from '@likec4/core'
import { describe, it } from 'vitest'
import { parsedModel } from './__fixtures__'
import { GraphvizLayouter } from './GraphvizLayoter'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'

describe('GraphvizLayouter with story views', () => {
  it('returns the story unchanged, stamped as layouted, with empty dot', async ({ expect }) => {
    const story = {
      [_stage]: 'computed',
      [_type]: 'story',
      id: ViewId('s'),
      title: null,
      description: null,
      tags: null,
      links: null,
      sceneLayout: 'anchored',
      scenes: [{ id: 'step-01', view: 'v1', astPath: '/a' }],
      storyFlow: [],
      nodes: [],
      edges: [],
      autoLayout: { direction: 'TopBottom' },
    } as unknown as ComputedStoryView

    const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())
    const { dot, diagram } = await layouter.layout({ view: story, styles: parsedModel.$styles })

    expect(dot).toBe('')
    expect(diagram[_stage]).toBe('layouted')
    expect(diagram[_type]).toBe('story')
    if (!isStoryView(diagram)) {
      throw new Error('expected diagram to be a story view')
    }
    expect(diagram.scenes).toEqual(story.scenes)
  })
})
