import { expectTypeOf, test } from 'vitest'
import { Builder } from '../builder'
import { computeLikeC4Model } from '../compute-view'
import {
  type ComputedDynamicView,
  type DiagramView,
  type Fqn,
  type LayoutedLikeC4ModelData,
  ComputedView,
} from '../types'
// import { isLayoutedLikeC4Model } from './guards'
import { LikeC4Model } from './LikeC4Model'
import type { $UnwrapM } from './types'

test('LikeC4Model.create: should have types', () => {
  const {
    model: {
      model,
      actor,
      system,
      component,
      relTo,
    },
    deployment: {
      deployment,
      instanceOf,
      env,
      vm,
    },
    views: {
      deploymentView,
      views,
      view,
      viewOf,
      $include,
    },
    builder,
  } = Builder.forSpecification({
    elements: {
      actor: {
        style: {
          shape: 'person',
        },
      },
      system: {},
      component: {},
    },
    deployments: {
      env: {},
      vm: {},
    },
    relationships: {
      like: {},
      dislike: {},
    },
    tags: {
      tag1: {},
      tag2: {},
    },
    metadataKeys: ['key1', 'key2'],
  })

  const source = builder
    .with(
      model(
        actor('alice'),
        actor('bob'),
        system('cloud').with(
          component('backend').with(
            component('api'),
            component('db'),
          ),
          component('frontend').with(
            relTo('cloud.backend.api'),
          ),
        ),
      ),
      deployment(
        env('prod').with(
          vm('vm1'),
          vm('vm2'),
        ),
        env('dev').with(
          vm('vm1'),
          instanceOf('api', 'cloud.backend.api'),
          vm('vm2'),
        ),
      ),
      views(
        view('index', $include('*')),
        deploymentView('prodview', $include('*')),
      ),
    )
    .build()

  const m = LikeC4Model.fromParsed(source)

  // Check view types
  expectTypeOf(m.view('index').$view).toBeNever()

  const computed = computeLikeC4Model(source)
  type A = $UnwrapM<typeof computed.Aux>
  expectTypeOf(computed.view('index').$view).toEqualTypeOf<ComputedView<A>>()
  expectTypeOf(computed.element('cloud.backend.api').defaultView!.$view).toEqualTypeOf<ComputedView<A>>()

  // type guard

  if (computed.isLayouted()) {
    expectTypeOf(computed.view('index').$view).toEqualTypeOf<DiagramView<A>>()
    expectTypeOf(computed.element('cloud.backend.api').defaultView!.$view).toEqualTypeOf<DiagramView<A>>()
  }

  const layouted = LikeC4Model.create(
    {} as LayoutedLikeC4ModelData<typeof m.Aux>,
  )
  type A2 = $UnwrapM<typeof layouted.Aux>
  const v = layouted.view('index')
  expectTypeOf(v.$view).toEqualTypeOf<DiagramView<A2>>()
  if (v.isDynamicView()) {
    expectTypeOf(v.$view).toEqualTypeOf<DiagramView<A2> & ComputedDynamicView<A2>>()
  }

  // @ts-expect-error
  m.element('wrong')

  type Elements =
    | 'alice'
    | 'bob'
    | 'cloud'
    | 'cloud.backend'
    | 'cloud.backend.api'
    | 'cloud.backend.db'
    | 'cloud.frontend'

  // should not fail
  m.findElement('wrong')

  expectTypeOf(m.element).parameter(0).toEqualTypeOf<
    Elements | {
      id: Fqn<Elements>
    }
  >()

  const e = m.element('alice')

  expectTypeOf(e.getMetadata).parameter(0).toEqualTypeOf<'key1' | 'key2' | undefined>()
  expectTypeOf(() => e.getMetadata()).returns.toEqualTypeOf<Record<'key1' | 'key2', string>>()

  expectTypeOf(m.Aux.ElementId).toEqualTypeOf<Elements>()
  expectTypeOf(m.Aux.ViewId).toEqualTypeOf<'index' | 'prodview'>()
  expectTypeOf(m.Aux.DeploymentId).toEqualTypeOf<
    'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
  >()

  expectTypeOf(m.Aux.ElementKind).toEqualTypeOf<'actor' | 'system' | 'component'>()
  expectTypeOf(m.Aux.DeploymentKind).toEqualTypeOf<'env' | 'vm'>()
  expectTypeOf(m.Aux.RelationKind).toEqualTypeOf<'like' | 'dislike'>()
  expectTypeOf(m.Aux.Tag).toEqualTypeOf<'tag1' | 'tag2'>()
  expectTypeOf(m.Aux.MetadataKey).toEqualTypeOf<'key1' | 'key2'>()
})

test('LikeC4Model.fromDump: should have types', () => {
  const m = LikeC4Model.fromDump({
    __: 'layouted',
    specification: {
      tags: {},
      elements: {},
      relationships: {},
      deployments: {},
    },
    elements: {
      el1: {},
      el2: {},
    },
    relations: {},
    globals: {
      predicates: {},
      dynamicPredicates: {},
      styles: {},
    },
    views: {
      v1: {},
      v2: {},
    },
    deployments: {
      elements: {
        d1: {},
        d2: {},
      },
      relations: {},
    },
  })
  expectTypeOf(m.view('v1').$view).toEqualTypeOf<DiagramView<$UnwrapM<typeof m.Aux>>>()

  expectTypeOf(m.Aux.ElementId).toEqualTypeOf<'el1' | 'el2'>()
  expectTypeOf(m.Aux.ViewId).toEqualTypeOf<'v1' | 'v2'>()
  expectTypeOf(m.Aux.DeploymentId).toEqualTypeOf<'d1' | 'd2'>()
})
