import { expectTypeOf, test } from 'vitest'
import { Builder } from '../builder'
import { computeViews } from '../compute-view/compute-view'
import type { ComputedView, Fqn, ViewId } from '../types'
import { LikeC4Model } from './LikeC4Model'

test('LikeC4Model: should have types', () => {
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

  const source = builder
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
        deploymentView('prodview', $include('*'))
      )
    )
    .build()

  const computed = computeViews(source)
  const m = LikeC4Model.create(computed)

  expectTypeOf(m.Aux.Element).toEqualTypeOf(
    '' as 'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'
  )
  expectTypeOf(m.Aux.Fqn).toEqualTypeOf(
    '' as Fqn<'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'>
  )
  expectTypeOf(m.Aux.ViewId).toEqualTypeOf(
    '' as ViewId<'index' | 'prodview'>
  )
  expectTypeOf(m.Aux.ViewType).toEqualTypeOf(
    {} as ComputedView<ViewId<'index' | 'prodview'>>
  )
  expectTypeOf(m.Aux.Deployment).toEqualTypeOf(
    '' as 'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
  )
  expectTypeOf(m.Aux.DeploymentFqn).toEqualTypeOf(
    '' as Fqn<'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'>
  )
})

test('LikeC4Model: should have types from arguments', () => {
  const m = LikeC4Model.fromDump({
    specification: {
      tags: [],
      elements: {},
      relationships: {},
      deployments: {}
    },
    elements: {
      el1: {},
      el2: {}
    },
    relations: {},
    globals: {
      predicates: {},
      dynamicPredicates: {},
      styles: {}
    },
    views: {
      v1: {},
      v2: {}
    },
    deployments: {
      elements: {
        d1: {},
        d2: {}
      },
      relations: {}
    }
  })
  expectTypeOf(m.Aux.Element).toEqualTypeOf(
    '' as 'el1' | 'el2'
  )
  expectTypeOf(m.Aux.Fqn).toEqualTypeOf(
    '' as Fqn<'el1' | 'el2'>
  )
  expectTypeOf(m.Aux.ViewId).toEqualTypeOf(
    '' as ViewId<'v1' | 'v2'>
  )
  expectTypeOf(m.Aux.Deployment).toEqualTypeOf(
    '' as 'd1' | 'd2'
  )
  expectTypeOf(m.Aux.DeploymentFqn).toEqualTypeOf(
    '' as Fqn<'d1' | 'd2'>
  )
})
