import { expectTypeOf, test } from 'vitest'
import type { LikeC4Model } from '../model/LikeC4Model'
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
    deployment: {
      deployment,
      instanceOf,
      env,
      vm
    },
    views: {
      deploymentView,
      views,
      view,
      viewOf,
      $rules,
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
    deployments: {
      env: {},
      vm: {}
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
      deployment(
        env('prod').with(
          vm('vm1'),
          vm('vm2')
        ),
        env('dev').with(
          vm('vm1'),
          instanceOf('api', 'cloud.backend.api'),
          vm('vm2')
        )
      ),
      views(
        view('index', $include('*')),
        viewOf(
          'cloud',
          'cloud',
          $rules(
            $include('*'),
            $include('cloud.backend.*')
          )
        ),
        deploymentView(
          'prod',
          $rules(
            $include('prod.*')
          )
        )
      )
    )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'
  )
  expectTypeOf(m.Types.ViewId).toEqualTypeOf(
    '' as 'index' | 'cloud' | 'prod'
  )
  expectTypeOf(m.Types.DeploymentFqn).toEqualTypeOf(
    '' as 'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4Model<
      'actor' | 'system' | 'component',
      'like' | 'dislike',
      'tag1' | 'tag2',
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'index' | 'cloud' | 'prod',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
    >
  )

  expectTypeOf(m.buildComputedModel()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api',
      'index' | 'cloud' | 'prod'
    >
  )
})

test('should have types with direct buuilder', () => {
  const m = Builder
    .specification({
      elements: {
        actor: {
          style: {
            shape: 'person'
          }
        },
        system: {},
        component: {}
      },
      deployments: {
        env: {},
        vm: {}
      },
      relationships: {
        like: {},
        dislike: {}
      },
      tags: ['tag1', 'tag2', 'tag1']
    })
    .model(({ actor, system, component, relTo }, _) =>
      _(
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
      )
    )
    .deployment(({ env, vm, instanceOf }, _) =>
      _(
        env('prod').with(
          vm('vm1'),
          vm('vm2')
        ),
        env('dev').with(
          vm('vm1'),
          instanceOf('api', 'cloud.backend.api'),
          vm('vm2')
        )
      )
    )
    .views(({ view, viewOf, deploymentView, $rules, $include }, _) =>
      _(
        view('index', $include('*')),
        viewOf(
          'cloud',
          'cloud',
          $rules(
            $include('*'),
            $include('cloud.backend.*')
          )
        ),
        deploymentView(
          'prod',
          $rules(
            $include('prod.*')
          )
        )
      )
    )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'
  )
  expectTypeOf(m.Types.ViewId).toEqualTypeOf(
    '' as 'index' | 'cloud' | 'prod'
  )
  expectTypeOf(m.Types.DeploymentFqn).toEqualTypeOf(
    '' as 'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4Model<
      'actor' | 'system' | 'component',
      'like' | 'dislike',
      'tag1' | 'tag2',
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'index' | 'cloud' | 'prod',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
    >
  )

  expectTypeOf(m.buildComputedModel()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api',
      'index' | 'cloud' | 'prod'
    >
  )
})
