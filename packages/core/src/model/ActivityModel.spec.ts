import { map, mapToObj, pipe, prop } from 'remeda'
import { describe, it } from 'vitest'
import { Builder } from '../builder'

describe('LikeC4 ActivityModel', () => {
  const b = Builder
    .specification({
      elements: {
        el: {},
      },
      tags: ['t1', 't2'],
    })
    .model(({ el, activity }, _) =>
      _(
        el('customer').with(
          activity('A'),
        ),
        el('cloud'),
        el('cloud.ui').with(
          activity('B'),
        ),
        el('cloud.backend').with(
          activity('C'),
        ),
        el('infra'),
        el('infra.db').with(
          activity('D'),
        ),
      )
    )

  it('should create relationships', ({ expect }) => {
    const m = b
      .clone()
      .model(({ activity }, _) =>
        _(
          activity('customer#A', {
            steps: [
              '-> cloud.ui#B',
            ],
          }),
          activity('cloud.ui#B', {
            steps: [
              '-> cloud.backend#C',
            ],
          }),
          activity('cloud.backend#C', {
            steps: [
              '-> infra.db#D',
            ],
          }),
        )
      )
      .toLikeC4Model()
    expect(map([...m.relationships()], prop('expression'))).toEqual([
      'customer#A -> cloud.ui#B',
      'cloud.ui#B -> cloud.backend#C',
      'cloud.backend#C -> infra.db#D',
    ])
    expect(map([...m.outgoing('cloud.ui')], o => o.target.id)).toEqual([
      'cloud.backend',
    ])
    expect(map([...m.incoming('infra')], o => o.source.id)).toEqual([
      'cloud.backend',
    ])
  })

  it('should inherit tags', ({ expect }) => {
    const m = b
      .clone()
      .model(({ activity, step }, _) =>
        _(
          activity('customer#A', {
            tags: ['t1'],
            steps: [
              '-> cloud.ui#B',
            ],
          }),
          activity('cloud.ui#B', {
            steps: [
              step('-> infra.db', {
                tags: ['t1'],
              }),
              step('-> cloud.backend', {
                tags: ['t2'],
              }),
            ],
          }),
          activity('cloud.backend#C', {
            tags: ['t1'],
            steps: [
              step('-> infra.db', {
                tags: ['t2'],
              }),
            ],
          }),
        )
      )
      .toLikeC4Model()
    expect(
      pipe(
        [...m.relationships()],
        mapToObj(r => [r.expression, r.tags]),
      ),
    ).toEqual({
      'customer#A -> cloud.ui#B': ['t1'],
      'cloud.ui#B -> infra.db': ['t1'],
      'cloud.ui#B -> cloud.backend': ['t2'],
      'cloud.backend#C -> infra.db': ['t1', 't2'],
    })
  })
})
