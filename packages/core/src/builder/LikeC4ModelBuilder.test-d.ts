import { assertType, describe, expectTypeOf, it } from 'vitest'
import type { ParsedLikeC4Model } from '../types'
import { LikeC4ModelBuilder } from './LikeC4ModelBuilder'
import { $include, $rules } from './view-ops'

describe('LikeC4ModelBuilder - types', () => {
  it('should have types', () => {
    const model = LikeC4ModelBuilder({
      elements: {
        actor: {
          style: {
            shape: 'person'
          }
        },
        system: {},
        component: {}
      },
      relationships: {
        like: {},
        dislike: {}
      },
      tags: ['tag1', 'tag2', 'tag1']
    })
      .actor('alice')
      .actor('bob')
      .system('cloud', cloud =>
        cloud
          .component('backend', backend =>
            backend.title('Backend')
              .component('api')
              .component('db'))
          .component('frontend', frontend =>
            frontend
              .rel('cloud.backend.api')))
      .build()

    expectTypeOf(model).toEqualTypeOf(
      {} as ParsedLikeC4Model<
        'actor' | 'system' | 'component',
        'like' | 'dislike',
        'tag1' | 'tag2',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        never
      >
    )
  })

  it('should fail for not existing fqn', () => {
    const builder = LikeC4ModelBuilder({
      elements: {
        actor: {}
      }
    })
      .actor('alice')
      .actor('bob')

    // @ts-expect-error - bob2 does not exist
    assertType(builder.relationship('alice', 'bob2'))
  })
})
