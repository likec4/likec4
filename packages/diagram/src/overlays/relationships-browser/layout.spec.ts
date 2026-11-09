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
        relationships: {
          async: { multiple: true },
        },
        tags: {
          new: {},
        },
      })
      .model(({ system, rel }, _) =>
        _(
          system('systemA'),
          system('systemB', { tags: ['new'] }),
          rel('systemA', 'systemB', { title: 'first', kind: 'async', tags: ['new'] }),
          rel('systemA', 'systemB', { title: 'second', kind: 'async', tags: ['new'] }),
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
                multiple: true,
              },
            }),
          ),
        )
      )
      .toLikeC4Model()

    const scope = model.view('index')
    const relationships = computeRelationshipsView('systemA', model, scope.id, 'view')
    const result = layoutRelationshipsView(relationships, scope)

    expect([...scope.edges()]).toHaveLength(2)
    expect(result.edges).toHaveLength(1)
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

  it('preserves an absent tail from a scoped edge', () => {
    const model = Builder
      .specification({
        elements: {
          system: {},
        },
      })
      .model(({ system, rel }, _) =>
        _(
          system('systemA'),
          system('systemB'),
          system('systemB.child1'),
          system('systemB.child2'),
          rel('systemA', 'systemB.child1', { title: 'first', tail: 'normal' }),
          rel('systemA', 'systemB.child2', { title: 'second', tail: 'diamond' }),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('index').with(
            $include('systemA'),
            $include('systemB'),
            $include('systemA -> systemB'),
          ),
        )
      )
      .toLikeC4Model()

    const scope = model.view('index')
    const relationships = computeRelationshipsView('systemA', model, scope.id, 'view')
    const result = layoutRelationshipsView(relationships, scope)

    expect([...scope.edges()]).toHaveLength(1)
    expect([...scope.edges()][0]?.tail).toBeUndefined()
    expect(result.edges).toHaveLength(2)
    expect(result.edges.every(edge => edge.tail === undefined)).toBe(true)
  })
})
