import { expectTypeOf, test } from 'vitest'
import type { ParsedLikeC4Model } from '../types'
import { Builder } from './Builder'

test('should have types', () => {
  const {
    model: {
      model,
      actor,
      system,
      component,
      relTo
    },
    views: {
      views,
      view,
      viewOf,
      $include
    },
    builder
  } = Builder.forSpecification({
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

  const m = builder
    .with(
      model(
        actor('alice'),
        actor('bob'),
        system('cloud').with(
          component('backend').with(
            component('api'),
            component('db')
          ),
          component('frontend').with(
            relTo('cloud.backend.api')
          )
        )
      ),
      views(
        view('index', $include('*')),
        viewOf('cloud', 'cloud', $include('*'))
      )
    )
    .build()

  expectTypeOf(m).toEqualTypeOf(
    {} as ParsedLikeC4Model<
      'actor' | 'system' | 'component',
      'like' | 'dislike',
      'tag1' | 'tag2',
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'index' | 'cloud'
    >
  )
})
