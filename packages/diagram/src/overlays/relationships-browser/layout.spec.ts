import { Builder } from '@likec4/core/builder'
import { computeRelationshipsView } from '@likec4/core/compute-view'
import { describe, expect, it } from 'vitest'
import { layoutRelationshipsView } from './layout'

describe('layoutRelationshipsView', () => {
  it('applies relationship styling from the current view', () => {
    const model = Builder
      .specification({
        elements: {
          system: {},
        },
        tags: {
          new: {},
        },
      })
      .model(({ system, rel }, _) =>
        _(
          system('systemA'),
          system('systemB', { tags: ['new'] }),
          rel('systemA', 'systemB', { tags: ['new'] }),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('index').with(
            $include('*'),
            $include('* -> *', {
              where: 'tag is #new',
              with: {
                color: 'green',
                line: 'solid',
                head: 'diamond',
              },
            }),
          ),
        )
      )
      .toLikeC4Model()

    const scope = model.view('index')
    const relationships = computeRelationshipsView('systemA', model, scope.id, 'view')
    const result = layoutRelationshipsView(relationships, scope)

    expect(result.edges).toContainEqual(
      expect.objectContaining({
        sourceFqn: 'systemA',
        targetFqn: 'systemB',
        color: 'green',
        line: 'solid',
        head: 'diamond',
      }),
    )
  })
})
