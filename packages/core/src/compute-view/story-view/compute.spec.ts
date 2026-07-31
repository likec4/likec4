import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { LikeC4Model } from '../../model'
import { type ParsedStoryView, type ViewId, _stage, _type } from '../../types'
import { computeStoryView } from './compute'

const builder = Builder.specification({
  elements: {
    el: {},
  },
})

function buildModel() {
  const parsed = builder
    .model(({ el }, _) => _(el('v1'), el('v2')))
    .views(({ view, $include, $rules }, _) =>
      _(
        view('v1', 'v1', $rules($include('v1'))),
        view('v2', 'v2', $rules($include('v2'))),
      )
    )
    .build()
  return LikeC4Model.create(parsed)
}

describe('computeStoryView', () => {
  it('assigns sequential scene paths and defaults sceneLayout to anchored', () => {
    const model = buildModel()
    const view = computeStoryView(
      model,
      {
        [_stage]: 'parsed',
        [_type]: 'story',
        id: 's' as ViewId,
        title: null,
        description: null,
        tags: null,
        links: null,
        statements: [
          { view: 'v1' as ViewId, astPath: '/statements@0' },
          { view: 'v2' as ViewId, astPath: '/statements@1' },
        ],
      } as unknown as ParsedStoryView<any>,
    )

    expect(view.sceneLayout).toBe('anchored')
    expect(view.nodes).toEqual([])
    expect(view.edges).toEqual([])
    expect(view.scenes.map(s => s.id)).toEqual(['step-01', 'step-02'])
    expect(view.scenes.map(s => s.view)).toEqual(['v1', 'v2'])
  })

  it('nests alt branches into hierarchical paths and records the branch title', () => {
    const model = buildModel()
    const view = computeStoryView(
      model,
      {
        [_stage]: 'parsed',
        [_type]: 'story',
        id: 's' as ViewId,
        title: null,
        description: null,
        tags: null,
        links: null,
        statements: [
          { view: 'v1' as ViewId, astPath: '/statements@0' },
          {
            [_type]: 'alt',
            branches: [
              {
                [_type]: 'when',
                title: 'fast',
                statements: [{ view: 'v2' as ViewId, astPath: '/x' }],
              },
              {
                [_type]: 'else',
                statements: [{ view: 'v1' as ViewId, astPath: '/y' }],
              },
            ],
          },
        ],
      } as unknown as ParsedStoryView<any>,
    )

    expect(view.scenes.map(s => s.id)).toEqual([
      'step-01',
      'step-02:alt.01:when.01',
      'step-02:alt.02:else.01',
    ])
    expect(view.scenes[1]!.branchTitle).toBe('fast')
  })

  it('throws when a scene references a view missing from the model', () => {
    const model = buildModel()

    expect(() =>
      computeStoryView(
        model,
        {
          [_stage]: 'parsed',
          [_type]: 'story',
          id: 's' as ViewId,
          title: null,
          description: null,
          tags: null,
          links: null,
          statements: [
            { view: 'does-not-exist' as ViewId, astPath: '/statements@0' },
          ],
        } as unknown as ParsedStoryView<any>,
      )
    ).toThrowError(/does-not-exist/)
  })
})
