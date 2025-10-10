import { expectTypeOf, test } from 'vitest'
import { Builder } from '../builder'
import {
  type Any,
  type AnyComputed,
  type AnyLayouted,
  type AnyParsed,
  type Aux,
  type aux,
  type AuxFromLikeC4ModelData,
  type ComputedDeploymentView,
  type ComputedElementView,
  type ComputedLikeC4ModelData,
  type ComputedView,
  type DiagramView,
  type DynamicViewDisplayVariant,
  type Fqn,
  type IteratorLike,
  type LayoutedDeploymentView,
  type LayoutedDynamicView,
  type LayoutedElementView,
  type LayoutedLikeC4ModelData,
  type LayoutedView,
  type ParsedLikeC4ModelData,
  type scalar,
  type UnknownComputed,
  type UnknownLayouted,
  type UnknownParsed,
  type ViewWithType,
  _stage,
} from '../types'
import type { ElementModel } from './ElementModel'
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

test('LikeC4Model.Parsed', () => {
  expectTypeOf({} as LikeC4Model.Parsed).toEqualTypeOf<LikeC4Model<UnknownParsed>>()
  expectTypeOf({} as LikeC4Model.Parsed<unknown>).toEqualTypeOf<LikeC4Model<UnknownParsed>>()
  expectTypeOf({} as LikeC4Model.Parsed<any>).toEqualTypeOf<LikeC4Model<AnyParsed>>()
})

test('LikeC4Model.Computed', () => {
  expectTypeOf({} as LikeC4Model.Computed).toEqualTypeOf<LikeC4Model<UnknownComputed>>()
  expectTypeOf({} as LikeC4Model.Computed<unknown>).toEqualTypeOf<LikeC4Model<UnknownComputed>>()
  expectTypeOf({} as LikeC4Model.Computed<{}>).toEqualTypeOf<LikeC4Model<UnknownComputed>>()
  expectTypeOf({} as LikeC4Model.Computed<any>).toEqualTypeOf<LikeC4Model<AnyComputed>>()
  expectTypeOf({} as LikeC4Model.Computed<AnyComputed>).toEqualTypeOf<LikeC4Model<AnyComputed>>()
  expectTypeOf({} as LikeC4Model.Computed<AnyLayouted>).toEqualTypeOf<LikeC4Model<AnyComputed>>()
})

test('LikeC4Model.Layouted', () => {
  expectTypeOf({} as LikeC4Model.Layouted).toEqualTypeOf<LikeC4Model<UnknownLayouted>>()
  expectTypeOf({} as LikeC4Model.Layouted<unknown>).toEqualTypeOf<LikeC4Model<UnknownLayouted>>()
  expectTypeOf({} as LikeC4Model.Layouted<any>).toEqualTypeOf<LikeC4Model<AnyLayouted>>()
  expectTypeOf({} as LikeC4Model.Layouted<AnyLayouted>).toEqualTypeOf<LikeC4Model<AnyLayouted>>()
  expectTypeOf({} as LikeC4Model.Layouted<AnyParsed>).toEqualTypeOf<LikeC4Model<AnyLayouted>>()
  expectTypeOf({} as LikeC4Model.Layouted<AnyComputed>).toEqualTypeOf<LikeC4Model<AnyLayouted>>()
})

test('LikeC4Model.create: infer from Unknown', () => {
  const parsed = LikeC4Model.create({} as ParsedLikeC4ModelData)
  expectTypeOf(parsed).toEqualTypeOf<LikeC4Model<aux.UnknownParsed>>()
  expectTypeOf(parsed.stage).toEqualTypeOf<'parsed'>()

  const computed = LikeC4Model.create({} as ComputedLikeC4ModelData)
  expectTypeOf(computed).toEqualTypeOf<LikeC4Model<aux.UnknownComputed>>()
  expectTypeOf(computed.stage).toEqualTypeOf<'computed'>()

  const layouted = LikeC4Model.create({} as LayoutedLikeC4ModelData)
  expectTypeOf(layouted).toEqualTypeOf<LikeC4Model<aux.UnknownLayouted>>()
  expectTypeOf(layouted.stage).toEqualTypeOf<'layouted'>()
})

test('LikeC4Model.create: infer from data', () => {
  const parsedData = b.build()
  expectTypeOf(parsedData).toExtend<ParsedLikeC4ModelData<aux.AnyParsed>>()
  type AParsed = AuxFromLikeC4ModelData<typeof parsedData>
  expectTypeOf(parsedData._stage).toEqualTypeOf<'parsed'>()
  expectTypeOf<aux.Stage<AParsed>>().toEqualTypeOf<'parsed'>()
  expectTypeOf<aux.ViewId<AParsed>>().toEqualTypeOf<'index' | 'prodview'>()

  const m1 = LikeC4Model.create(parsedData)
  expectTypeOf(m1.Aux).toEqualTypeOf<AParsed>()
  expectTypeOf(m1.stage).toEqualTypeOf<'parsed'>()
  expectTypeOf(m1.$data).toEqualTypeOf<ParsedLikeC4ModelData<AParsed>>()
  expectTypeOf(m1.$data._stage).toEqualTypeOf<'parsed'>()
  expectTypeOf<aux.ViewId<typeof m1.Aux>>().toEqualTypeOf<'index' | 'prodview'>()

  const computedData1 = parsedData as unknown as ComputedLikeC4ModelData<aux.toComputed<AParsed>>
  const m2 = LikeC4Model.create(computedData1)
  type AComputed = typeof m2.Aux
  expectTypeOf<AComputed>().toEqualTypeOf<aux.toComputed<AParsed>>()
  expectTypeOf(m2.stage).toEqualTypeOf<'computed'>()
  expectTypeOf(m2.$data._stage).toEqualTypeOf<'computed'>()
  expectTypeOf<aux.Stage<AComputed>>().toEqualTypeOf<'computed'>()
  expectTypeOf<aux.ViewId<AComputed>>().toEqualTypeOf<'index' | 'prodview'>()

  const layoutedData = parsedData as unknown as LayoutedLikeC4ModelData<aux.toLayouted<AParsed>>
  const m3 = LikeC4Model.create(layoutedData)
  type ALayouted = typeof m3.Aux
  expectTypeOf<ALayouted>().toEqualTypeOf<aux.toLayouted<AParsed>>()
  expectTypeOf(m3.stage).toEqualTypeOf<'layouted'>()
  expectTypeOf(m3.$data._stage).toEqualTypeOf<'layouted'>()
  expectTypeOf<aux.Stage<ALayouted>>().toEqualTypeOf<'layouted'>()
  expectTypeOf<aux.ViewId<ALayouted>>().toEqualTypeOf<'index' | 'prodview'>()
})

test('LikeC4Model created from builder', () => {
  const m = b.toLikeC4Model()
  expectTypeOf(m.stage).toEqualTypeOf<'computed'>()
  expectTypeOf(m.view).parameter(0).toEqualTypeOf<'index' | 'prodview' | { id: scalar.ViewId<'index' | 'prodview'> }>()
  expectTypeOf(m.findView).parameter(0).toEqualTypeOf<'index' | 'prodview' | string & Record<never, never>>()
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
  expectTypeOf(parsed.view('index')).toBeNever()
  expectTypeOf(parsed.element('cloud').scopedViews()).toEqualTypeOf<
    ReadonlySet<LikeC4ViewModel.ScopedElementView<typeof parsed.Aux>>
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
  expectTypeOf(e.getMetadata('key1')).toEqualTypeOf<string | undefined>()
  expectTypeOf(e.getMetadata()).toEqualTypeOf<{
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
  const unknownModel = {} as LikeC4Model<aux.Unknown>
  expectTypeOf(unknownModel.stage).toEqualTypeOf<'computed' | 'layouted'>()
  if (unknownModel.isParsed()) {
    expectTypeOf(unknownModel).toBeNever()
  }
  if (unknownModel.isComputed()) {
    type A = typeof unknownModel.Aux
    expectTypeOf(unknownModel.stage).toEqualTypeOf<'computed'>()

    const v = unknownModel.view('index')
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()

    const node = v.node('cloud')
    expectTypeOf(node.x).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.y).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.width).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.height).toEqualTypeOf<number | undefined>()
    if (node.isLayouted()) {
      expectTypeOf(node).toBeNever()
    }

    if (v.isLayouted()) {
      expectTypeOf(v).toBeNever()
    }
    if (v.isComputed()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()
    }

    expectTypeOf(unknownModel.element('cloud').defaultView).toExtend<
      | null
      | LikeC4ViewModel<A, ComputedElementView<A>>
    >()
    expectTypeOf(unknownModel.deployment.views()).toEqualTypeOf<
      IteratorLike<LikeC4ViewModel.DeploymentView<A, ComputedDeploymentView<A>>>
    >()
  }
  if (unknownModel.isLayouted()) {
    type A = typeof unknownModel.Aux

    expectTypeOf<ViewWithType<DiagramView<A>, 'deployment'>>().toEqualTypeOf<LayoutedDeploymentView<A>>()
    expectTypeOf<ViewWithType<DiagramView<A>, 'element'>>().toEqualTypeOf<LayoutedElementView<A>>()
    expectTypeOf<ViewWithType<DiagramView<A>, 'dynamic'>>().toEqualTypeOf<LayoutedDynamicView<A>>()

    expectTypeOf(unknownModel.stage).toEqualTypeOf<'layouted'>()
    expectTypeOf(unknownModel.view('index')).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()

    const defaultView = unknownModel.element('cloud').defaultView
    expectTypeOf(defaultView).toExtend<
      | null
      | LikeC4ViewModel<A, LayoutedElementView<A> & { viewOf: aux.StrictFqn<A> }>
    >()
    expectTypeOf(defaultView!.viewOf).toEqualTypeOf<ElementModel<A>>()
    expectTypeOf(defaultView!.$view.viewOf).toEqualTypeOf<aux.StrictFqn<A>>()

    const v = unknownModel.view('index')
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
    if (v.isLayouted()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<A, DiagramView<A>>>()
    }
    if (v.isComputed()) {
      expectTypeOf(v).toBeNever()
    }
    const node = v.node('cloud')

    expectTypeOf(node.$viewModel.stage).toEqualTypeOf<'layouted'>()
    expectTypeOf(node.x).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.y).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.width).toEqualTypeOf<number | undefined>()
    expectTypeOf(node.height).toEqualTypeOf<number | undefined>()
    if (node.isLayouted()) {
      expectTypeOf(node.x).toEqualTypeOf<number>()
      expectTypeOf(node.y).toEqualTypeOf<number>()
      expectTypeOf(node.width).toEqualTypeOf<number>()
      expectTypeOf(node.height).toEqualTypeOf<number>()
    }

    expectTypeOf(v.viewOf).toEqualTypeOf<ElementModel<A> | null>()
    if (v.isScopedElementView()) {
      expectTypeOf(v.viewOf).toEqualTypeOf<ElementModel<A>>()
    }
    if (v.isDynamicView()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel.DynamicView<A, LayoutedDynamicView<A>>>()
    }
    if (v.isDeploymentView()) {
      expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel.DeploymentView<A, LayoutedDeploymentView<A>>>()
    }

    expectTypeOf(unknownModel.deployment.views()).toEqualTypeOf<
      IteratorLike<LikeC4ViewModel.DeploymentView<A, LayoutedDeploymentView<A>>>
    >()
  }

  const computed = {} as LikeC4Model.Computed
  type A = typeof computed.Aux
  expectTypeOf(computed.view('index')).toEqualTypeOf<LikeC4ViewModel<A, ComputedView<A>>>()
  expectTypeOf(computed.element('cloud.backend.api').defaultView).toExtend<
    null | LikeC4ViewModel<A, ComputedElementView<A> & { viewOf: aux.Fqn<A> }>
  >()
  expectTypeOf(computed.element('cloud.backend.api').defaultView!.viewOf).toEqualTypeOf<ElementModel<A>>()
  expectTypeOf(computed.element('cloud.backend.api').defaultView!.$view.viewOf).toEqualTypeOf<aux.Fqn<A>>()
  if (computed.isComputed()) {
    expectTypeOf(computed).toEqualTypeOf<LikeC4Model<A>>()
  }
  if (computed.isLayouted()) {
    expectTypeOf(computed).toBeNever()
  }
  if (computed.isParsed()) {
    expectTypeOf(computed).toBeNever()
  }

  const layouted = {} as LikeC4Model.Layouted

  if (layouted.isComputed()) {
    expectTypeOf(layouted).toBeNever()
  }
  if (layouted.isParsed()) {
    expectTypeOf(layouted).toBeNever()
  }

  const v = layouted.view('index')
  type L = typeof layouted.Aux
  expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<L, DiagramView<L>>>()
  expectTypeOf(v.mode).toEqualTypeOf<DynamicViewDisplayVariant | null>()
  if (v.isDynamicView()) {
    expectTypeOf(v._type).toEqualTypeOf<'dynamic'>()
    expectTypeOf(v.mode).toEqualTypeOf<DynamicViewDisplayVariant>()
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel.DynamicView<L, LayoutedDynamicView<L>>>()
  }
  if (v.isDeploymentView()) {
    expectTypeOf(v._type).toEqualTypeOf<'deployment'>()
    expectTypeOf(v.mode).toBeNever()
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel.DeploymentView<L, LayoutedDeploymentView<L>>>()
  }
  if (v.isElementView()) {
    expectTypeOf(v._type).toEqualTypeOf<'element'>()
    expectTypeOf(v.mode).toBeNever()
    expectTypeOf(v).toEqualTypeOf<
      LikeC4ViewModel.ElementView<
        L,
        LayoutedElementView<L>
      >
    >()
    expectTypeOf(v.viewOf).toEqualTypeOf<ElementModel<L> | null>()
  }
  if (v.isScopedElementView()) {
    expectTypeOf(v._type).toEqualTypeOf<'element'>()
    expectTypeOf(v.mode).toBeNever()
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel.ScopedElementView<L>>()
    expectTypeOf(v.$view).toEqualTypeOf<LayoutedElementView<L> & { viewOf: aux.StrictFqn<L> }>()
    expectTypeOf(v.viewOf).toEqualTypeOf<ElementModel<L>>()
  }
  expectTypeOf(v.mode).toEqualTypeOf<DynamicViewDisplayVariant | null>()
})

test('LikeC4Model<Any> type guards', () => {
  const m = {} as LikeC4Model<Any>
  expectTypeOf(m.stage).toEqualTypeOf<'computed' | 'layouted' | 'parsed'>()

  if (m.isParsed()) {
    expectTypeOf(m.stage).toEqualTypeOf<'parsed'>()
    expectTypeOf(m.Aux).toEqualTypeOf<Aux<'parsed', any, any, any, any, any>>()
    expectTypeOf(m.element).parameter(0).toEqualTypeOf<string | { id: scalar.Fqn }>()
    expectTypeOf(m.view).parameter(0).toEqualTypeOf<string | { id: scalar.ViewId }>()
    expectTypeOf(m.view('index')).toBeNever()
  }
  if (m.isComputed()) {
    expectTypeOf(m.stage).toEqualTypeOf<'computed'>()
    expectTypeOf(m.Aux).toEqualTypeOf<AnyComputed>()
    expectTypeOf(m.element).parameter(0).toEqualTypeOf<string | { id: scalar.Fqn }>()
    expectTypeOf(m.view).parameter(0).toEqualTypeOf<string | { id: scalar.ViewId }>()

    const v = m.view('index')
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<AnyComputed, ComputedView<AnyComputed>>>()
    if (v.isLayouted()) {
      expectTypeOf(v).toBeNever()
    }
  }
  if (m.isLayouted()) {
    expectTypeOf(m.stage).toEqualTypeOf<'layouted'>()
    expectTypeOf(m.Aux).toEqualTypeOf<AnyLayouted>()
    expectTypeOf(m.element).parameter(0).toEqualTypeOf<string | { id: scalar.Fqn }>()
    expectTypeOf(m.view).parameter(0).toEqualTypeOf<string | { id: scalar.ViewId }>()

    const v = m.view('index')
    expectTypeOf(v).toEqualTypeOf<LikeC4ViewModel<AnyLayouted, LayoutedView<AnyLayouted>>>()
    if (v.isComputed()) {
      expectTypeOf(v).toBeNever()
    }
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

  expectTypeOf(computed.view).parameter(0).toEqualTypeOf<'view1' | { id: scalar.ViewId<'view1'> }>()
  // @ts-expect-error
  computed.view('view2')
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
})

test('LikeC4Model.fromDump: should have types', () => {
  const m = LikeC4Model.fromDump({
    [_stage]: 'layouted',
    project: { id: 'test-project', config: { name: 'test-project' } },
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
