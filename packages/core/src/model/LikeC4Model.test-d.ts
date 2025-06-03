import { expectTypeOf, test } from 'vitest'
import { Builder } from '../builder'
import { computeLikeC4Model } from '../compute-view'
import {
  type ComputedView,
  type DiagramView,
  type Fqn,
  type IteratorLike,
  type LayoutedDynamicView,
  type LayoutedLikeC4ModelData,
  type Unknown,
  aux,
} from '../types'
// import { isLayoutedLikeC4Model } from './guards'
import { isLayoutedLikeC4Model } from './guards'
import { LikeC4Model } from './LikeC4Model'

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
    // metadataKeys: ['key1', 'key2'],
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

  const parsed = LikeC4Model.fromParsed(source)

  // Check view types
  expectTypeOf(parsed.view('index').$view).toBeNever()
  expectTypeOf(parsed.element('cloud').views()).toEqualTypeOf<IteratorLike<never>>()

  const empty = {} as LikeC4Model<Unknown>
  if (isLayoutedLikeC4Model(empty)) {
    expectTypeOf(empty.view('index').$view).toEqualTypeOf<DiagramView<typeof empty.Aux>>()
    expectTypeOf(empty.element('cloud.backend.api').defaultView!.$view).toEqualTypeOf<DiagramView<typeof empty.Aux>>()
  }

  const computed = computeLikeC4Model(source)
  type A = typeof computed.Aux
  type K = aux.MetadataKey<A>
  expectTypeOf(computed.view('index').$view).toEqualTypeOf<ComputedView<A>>()
  expectTypeOf(computed.element('cloud.backend.api').defaultView!.$view).toEqualTypeOf<ComputedView<A>>()

  if (computed.isLayouted()) {
    expectTypeOf(computed).toBeNever()
  }

  const layouted = LikeC4Model.create(
    {} as LayoutedLikeC4ModelData<typeof parsed.Aux>,
  )

  if (layouted.isComputed()) {
    expectTypeOf(layouted).toBeNever()
  }

  const v = layouted.view('index')
  expectTypeOf(v.$view).toEqualTypeOf<DiagramView<typeof layouted.Aux>>()
  if (v.isDynamicView()) {
    expectTypeOf(v.$view).toEqualTypeOf<LayoutedDynamicView<typeof layouted.Aux>>()
  }

  // @ts-expect-error
  parsed.element('wrong')

  type Elements =
    | 'alice'
    | 'bob'
    | 'cloud'
    | 'cloud.backend'
    | 'cloud.backend.api'
    | 'cloud.backend.db'
    | 'cloud.frontend'

  // should not fail
  parsed.findElement('wrong')

  expectTypeOf(parsed.element).parameter(0).toEqualTypeOf<
    Elements | {
      id: Fqn<Elements>
    }
  >()

  const e = parsed.element('cloud.backend.api')
  expectTypeOf(e.getMetadata).parameter(0).toEqualTypeOf<'key1' | 'key2' | undefined>()
  expectTypeOf(() => e.getMetadata()).returns.toEqualTypeOf<{
    key1?: string
    key2?: string
  }>()

  expectTypeOf(parsed.Aux.ElementId).toEqualTypeOf<Elements>()
  expectTypeOf(parsed.Aux.ViewId).toEqualTypeOf<'index' | 'prodview'>()
  expectTypeOf(parsed.Aux.DeploymentId).toEqualTypeOf<
    'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api'
  >()

  expectTypeOf(parsed.Aux.ElementKind).toEqualTypeOf<'actor' | 'system' | 'component'>()
  expectTypeOf(parsed.Aux.DeploymentKind).toEqualTypeOf<'env' | 'vm'>()
  expectTypeOf(parsed.Aux.RelationKind).toEqualTypeOf<'like' | 'dislike'>()
  expectTypeOf(parsed.Aux.Tag).toEqualTypeOf<'tag1' | 'tag2'>()
  expectTypeOf(parsed.Aux.MetadataKey).toEqualTypeOf<'key1' | 'key2'>()
})

test('LikeC4Model.fromDump: should have types', () => {
  const m = LikeC4Model.fromDump({
    __: 'layouted',
    specification: {
      tags: {
        tag1: {},
        tag2: {},
      },
      elements: {
        actor: {},
        system: {},
        component: {},
      },
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
