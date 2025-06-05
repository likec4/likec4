import { expectTypeOf, test } from 'vitest'
import { Builder } from '../builder'
import {
  type _type,
  type AnyAux,
  type AuxFromLikeC4ModelData,
  type ComputedElementView,
  type ComputedLikeC4ModelData,
  type ComputedView,
  type DiagramView,
  type Fqn,
  type IteratorLike,
  type LayoutedDeploymentView,
  type LayoutedDynamicView,
  type LayoutedElementView,
  type LayoutedLikeC4ModelData,
  type ParsedLikeC4ModelData,
  type scalar,
  type Unknown,
  type ViewWithType,
  _stage,
  aux,
} from '../types'
// import { isLayoutedLikeC4Model } from './guards'
import { LikeC4Model } from './LikeC4Model'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'

const b = Builder.specification({
  elements: {
    actor: {},
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
  .model(({ actor, system, component, relTo }, _) =>
    _(
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
    )
  )
  .deployment(({ env, vm, instanceOf }, _) =>
    _(
      env('prod').with(
        vm('vm1'),
        vm('vm2'),
      ),
      env('dev').with(
        vm('vm1'),
        instanceOf('api', 'cloud.backend.api'),
        vm('vm2'),
      ),
    )
  )
  .views(({ view, deploymentView, $include }, _) =>
    _(
      view('index', $include('*')),
      deploymentView('prodview', $include('*')),
    )
  )

test('LikeC4Model.create: infer from data', () => {
  const parsedData = b.build()
  expectTypeOf(parsedData).toExtend<ParsedLikeC4ModelData<AnyAux>>()
  type AParsed = AuxFromLikeC4ModelData<typeof parsedData>
  expectTypeOf(parsedData._stage).toEqualTypeOf<'parsed'>()
  expectTypeOf<aux.Stage<AParsed>>().toEqualTypeOf<'parsed'>()

  const m1 = LikeC4Model.create(parsedData)
  expectTypeOf(m1.Aux).toEqualTypeOf<AParsed>()
  expectTypeOf(m1.stage).toEqualTypeOf<'parsed'>()

  const computedData1 = parsedData as unknown as ComputedLikeC4ModelData<AParsed>
  const m2 = LikeC4Model.create(computedData1)
  expectTypeOf(m2.stage).toEqualTypeOf<'computed'>()
  expectTypeOf(m2.Aux).not.toEqualTypeOf<AParsed>()

  type AComputed = aux.toComputed<AParsed>
  expectTypeOf<aux.Stage<AComputed>>().toEqualTypeOf<'computed'>()
  expectTypeOf(m2.Aux).toEqualTypeOf<AComputed>()

  const computedData2 = parsedData as unknown as ComputedLikeC4ModelData<AComputed>
  const m3 = LikeC4Model.create(computedData2)
  expectTypeOf(m3.stage).toEqualTypeOf<'computed'>()
  expectTypeOf(m3.Aux).toEqualTypeOf<AComputed>()

  type ALayouted = aux.toLayouted<AParsed>
  expectTypeOf<aux.Stage<ALayouted>>().toEqualTypeOf<'layouted'>()

  const layoutedData = computedData2 as unknown as LayoutedLikeC4ModelData<ALayouted>
  const m4 = LikeC4Model.create(layoutedData)
  expectTypeOf(m4.stage).toEqualTypeOf<'layouted'>()
  expectTypeOf(m4.Aux).toEqualTypeOf<ALayouted>()
})

test('LikeC4Model.create: should have all types', () => {
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

  const parsed = LikeC4Model.create(source)
  expectTypeOf(parsed.$data[_stage]).toEqualTypeOf<'parsed'>()

  // Check view types
  expectTypeOf(parsed.view('index')).toEqualTypeOf<
    LikeC4ViewModel<typeof parsed.Aux, never>
  >()
  expectTypeOf(parsed.element('cloud').scopedViews()).toEqualTypeOf<
    IteratorLike<LikeC4ViewModel<typeof parsed.Aux, never>>
  >()

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

test('LikeC4Model type guards', () => {
  const unknownModel = {} as LikeC4Model<Unknown>
  expectTypeOf(unknownModel.stage).toEqualTypeOf<'computed' | 'layouted'>()
  if (unknownModel.isParsed()) {
    expectTypeOf(unknownModel).toBeNever()
  }
  if (unknownModel.isComputed()) {
    type A = typeof unknownModel.Aux
    expectTypeOf(unknownModel.stage).toEqualTypeOf<'computed'>()
    expectTypeOf(unknownModel.view('index')).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()
    expectTypeOf(unknownModel.element('cloud').defaultView).toEqualTypeOf<
      | null
      | LikeC4ViewModel<A, ComputedElementView<A> & { [_type]: 'element' } & { viewOf: aux.Fqn<A> }>
    >()
  }
  if (unknownModel.isLayouted()) {
    type A = typeof unknownModel.Aux
    expectTypeOf(unknownModel.stage).toEqualTypeOf<'layouted'>()
    expectTypeOf(unknownModel.view('index')).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
    expectTypeOf(unknownModel.element('cloud').defaultView).toEqualTypeOf<
      | null
      | LikeC4ViewModel<A, LayoutedElementView<A> & { [_type]: 'element' } & { viewOf: aux.Fqn<A> }>
    >()

    const v = unknownModel.view('index')
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
    expectTypeOf<ViewWithType<DiagramView<A>, 'deployment'>>().toEqualTypeOf<LayoutedDeploymentView<A>>()
    expectTypeOf<ViewWithType<DiagramView<A>, 'element'>>().toEqualTypeOf<LayoutedElementView<A>>()
    expectTypeOf<ViewWithType<DiagramView<A>, 'dynamic'>>().toEqualTypeOf<LayoutedDynamicView<A>>()
    if (v.isDiagram()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
    }
    if (v.isScopedElementView()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, LayoutedElementView<A> & { viewOf: aux.Fqn<A> }>>()
    }
    if (v.isDynamicView()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, LayoutedDynamicView<A>>>()
    }
  }

  const computed = {} as LikeC4Model.Computed<Unknown>
  type A = typeof computed.Aux
  expectTypeOf(computed.view('index')).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()
  expectTypeOf(computed.element('cloud.backend.api').defaultView).toEqualTypeOf<
    null | LikeC4ViewModel<A, ComputedElementView<A> & { [_type]: 'element' } & { viewOf: aux.Fqn<A> }>
  >()

  if (computed.isLayouted()) {
    expectTypeOf(computed).toBeNever()
  }
  if (computed.isParsed()) {
    expectTypeOf(computed).toBeNever()
  }

  const layouted = {} as LikeC4Model.Layouted<Unknown>

  if (layouted.isComputed()) {
    expectTypeOf(layouted).toBeNever()
  }
  if (layouted.isParsed()) {
    expectTypeOf(layouted).toBeNever()
  }

  const v = layouted.view('index')
  type L = typeof layouted.Aux
  expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<L, DiagramView<L>>>()
  if (v.isDynamicView()) {
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<L, LayoutedDynamicView<L>>>()
  }
  if (v.isDeploymentView()) {
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<L, LayoutedDeploymentView<L>>>()
  }
  if (v.isElementView()) {
    expectTypeOf(v).toEqualTypeOf<
      LikeC4ViewModel<
        L,
        LayoutedElementView<L>
      >
    >()
  }
  if (v.isScopedElementView()) {
    expectTypeOf(v).toEqualTypeOf<
      LikeC4ViewModel<
        L,
        LayoutedElementView<L> & { viewOf: aux.Fqn<A> }
      >
    >()
  }
})

test('LikeC4Model.create: should have defined types and never for missing', () => {
  const {
    model: {
      model,
      actor,
      component,
    },
    views: {
      views,
      view,
      $include,
    },
    builder,
  } = Builder.forSpecification({
    elements: {
      actor: {},
      component: {},
    },
    deployments: {
      env: {},
    },
  })

  const b = builder
    .with(
      model(
        actor('alice'),
        component('cloud'),
        component('cloud.frontend'),
      ),
      views(
        view('view1', $include('*')),
      ),
    )

  const computed = b.toLikeC4Model()

  type A = typeof computed.Aux
  expectTypeOf(computed.tags).toEqualTypeOf<readonly never[]>()
  expectTypeOf(computed.tagsSortedByUsageCount).toEqualTypeOf<readonly never[]>()

  expectTypeOf(computed.view).parameter(0).toEqualTypeOf<'view1' | { id: scalar.ViewId<'view1'> }>()
  expectTypeOf(computed.findView).parameter(0).toEqualTypeOf<'view1' | string & Record<never, never>>()
  expectTypeOf(computed.element).parameter(0).toEqualTypeOf<
    'cloud' | 'alice' | 'cloud.frontend' | { id: scalar.Fqn<'cloud' | 'alice' | 'cloud.frontend'> }
  >()
  expectTypeOf(computed.deployment.element).parameter(0).toEqualTypeOf<
    { id: never }
  >()
  expectTypeOf(computed.stage).toEqualTypeOf<'computed'>()

  if (computed.isLayouted()) {
    expectTypeOf(computed).toBeNever()
  }

  expectTypeOf(computed.view('view1')).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()
  // const v = computed.view('view1')
})

test('LikeC4Model.fromDump: should have types', () => {
  const m = LikeC4Model.fromDump({
    [_stage]: 'layouted',
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
    },
  })
  type A = typeof m.Aux
  expectTypeOf<aux.Stage<A>>().toEqualTypeOf<'layouted'>()
  expectTypeOf<aux.ElementId<A>>().toEqualTypeOf<'el1' | 'el2'>()
  expectTypeOf(m.view('v1')).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
})
