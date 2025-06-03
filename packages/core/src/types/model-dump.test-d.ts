import { describe, expectTypeOf, it } from 'vitest'
import type * as aux from './aux'
import type { Aux, SpecAux } from './aux'
import type { AuxFromDump, LikeC4ModelDump, SpecificationDump, SpecTypesFromDump } from './model-dump'
import type { ComputedView, DiagramView } from './view'

function castSpec<const T extends SpecificationDump>(value: T): T {
  return value
}

function castModel<const T extends LikeC4ModelDump>(value: T): T {
  return value
}

describe('SpecTypesFromDump', () => {
  it('should convert empty SpecificationJson to SpecTypes with never types', () => {
    const emptySpec = castSpec({
      elements: {},
    })
    type Result = SpecTypesFromDump<typeof emptySpec>

    expectTypeOf<Result>().toEqualTypeOf<
      SpecAux<
        never,
        never,
        never,
        never,
        never
      >
    >()
  })

  it('should convert SpecificationJson with all fields to SpecTypes', () => {
    const spec = castSpec({
      elements: {
        'system': {},
        'container': {
          style: {
            size: 'md',
          },
        },
      },
      tags: {
        'important': {
          color: 'rgb(255, 0, 0)',
        },
        'deprecated': {
          color: 'rgba(255, 0, 0, 0.65)',
        },
      },
      deployments: {
        'pod': {},
        'container': {},
      },
      relationships: {
        'http': {},
        'grpc': {},
      },
      metadataKeys: ['version', 'owner'],
    })

    type Result = SpecTypesFromDump<typeof spec>

    expectTypeOf<Result>().toEqualTypeOf<
      SpecAux<
        'system' | 'container',
        'pod' | 'container',
        'http' | 'grpc',
        'important' | 'deprecated',
        'version' | 'owner'
      >
    >()

    expectTypeOf<Result>().toHaveProperty('Tag').toEqualTypeOf<'important' | 'deprecated'>()
    expectTypeOf<Result>().toHaveProperty('ElementKind').toEqualTypeOf<'system' | 'container'>()
    expectTypeOf<Result>().toHaveProperty('DeploymentKind').toEqualTypeOf<'pod' | 'container'>()
    expectTypeOf<Result>().toHaveProperty('RelationKind').toEqualTypeOf<'http' | 'grpc'>()
    expectTypeOf<Result>().toHaveProperty('MetadataKey').toEqualTypeOf<'version' | 'owner'>()
  })

  it('should handle optional fields in SpecificationJson', () => {
    const spec = castSpec({
      elements: {
        'system': {},
      },
      relationships: {
        'http': {},
      },
    })
    type TestSpec = typeof spec
    type Result = SpecTypesFromDump<TestSpec>

    expectTypeOf<Result>().toEqualTypeOf<SpecAux<'system', never, 'http', never, never>>()
  })

  it('should return never for non-SpecificationJson types', () => {
    type NotASpec = {
      foo: string
      bar: number
    }

    type Result = SpecTypesFromDump<NotASpec>

    expectTypeOf<Result>().toEqualTypeOf<SpecAux<never, never, never, never, never>>()
  })
})

describe('AuxFromDump', () => {
  it('should convert empty LikeC4ModelDump to Aux with never types', () => {
    const emptyModel = castModel({
      _stage: 'computed',
      projectId: 'test-project',
      elements: {},
      views: {},
      deployments: {},
      specification: {
        elements: {},
      },
    })
    type Result = AuxFromDump<typeof emptyModel>

    expectTypeOf<Result>().toEqualTypeOf<
      Aux<'computed', never, never, never, 'test-project', SpecAux<never, never, never, never, never>>
    >()
    expectTypeOf<Result['Stage']>().toEqualTypeOf<'computed'>()
    expectTypeOf<aux.Stage<Result>>().toEqualTypeOf<'computed'>()
    expectTypeOf<aux.ProjectId<Result>>().toEqualTypeOf<'test-project'>()
    expectTypeOf<aux.ElementId<Result>>().toBeNever()
    expectTypeOf<aux.ViewId<Result>>().toBeNever()
    expectTypeOf<aux.DeploymentId<Result>>().toBeNever()
    expectTypeOf<aux.ElementKind<Result>>().toBeNever()
    expectTypeOf<aux.DeploymentKind<Result>>().toBeNever()
    expectTypeOf<aux.RelationKind<Result>>().toBeNever()
    expectTypeOf<aux.Tag<Result>>().toBeNever()
    expectTypeOf<aux.Tags<Result>>().items.toBeNever()
    expectTypeOf<aux.MetadataKey<Result>>().toBeNever()

    expectTypeOf<PickLikeC4ViewByStage<Result>>().toEqualTypeOf<ComputedView<Result>>()
  })

  it('should convert complete LikeC4ModelDump to Aux with correct types', () => {
    const model = castModel({
      __: 'computed',
      projectId: 'test-project',
      elements: {
        'element1': {},
        'element2': {},
      },
      views: {
        'view1': {},
        'view2': {},
      },
      deployments: {
        elements: {
          'deployment1': {},
          'deployment2': {},
        },
      },
      specification: {
        elements: {
          'system': {},
          'container': {},
        },
        deployments: {
          'k8s': {},
          'aws': {},
        },
        relationships: {
          'http': {},
          'grpc': {},
        },
        tags: {
          'important': { color: 'red' },
          'deprecated': { color: 'gray' },
        },
        metadataKeys: ['version', 'owner'],
      },
    })

    type A = AuxFromDump<typeof model>

    // Verify the main Aux type parameters
    expectTypeOf<A>().toEqualTypeOf<
      Aux<
        'computed',
        'element1' | 'element2',
        'deployment1' | 'deployment2',
        'view1' | 'view2',
        'test-project',
        SpecAux<
          'system' | 'container',
          'k8s' | 'aws',
          'http' | 'grpc',
          'important' | 'deprecated',
          'version' | 'owner'
        >
      >
    >()

    // Verify individual properties
    expectTypeOf<A['Stage']>().toEqualTypeOf<'computed'>()
    expectTypeOf<aux.Stage<A>>().toEqualTypeOf<'computed'>()
    expectTypeOf<A['ProjectId']>().toEqualTypeOf<'test-project'>()
    expectTypeOf<aux.ProjectId<A>>().toEqualTypeOf<'test-project'>()
    expectTypeOf<A['ElementId']>().toEqualTypeOf<'element1' | 'element2'>()
    expectTypeOf<aux.ElementId<A>>().toEqualTypeOf<'element1' | 'element2'>()
    expectTypeOf<A['DeploymentId']>().toEqualTypeOf<'deployment1' | 'deployment2'>()
    expectTypeOf<aux.DeploymentId<A>>().toEqualTypeOf<'deployment1' | 'deployment2'>()
    expectTypeOf<A['ViewId']>().toEqualTypeOf<'view1' | 'view2'>()
    expectTypeOf<aux.ViewId<A>>().toEqualTypeOf<'view1' | 'view2'>()

    // Verify Spec properties
    expectTypeOf<A['Spec']>().toEqualTypeOf<
      SpecAux<
        'system' | 'container',
        'k8s' | 'aws',
        'http' | 'grpc',
        'important' | 'deprecated',
        'version' | 'owner'
      >
    >()

    // Verify derived types
    expectTypeOf<A['ElementKind']>().toEqualTypeOf<'system' | 'container'>()
    expectTypeOf<aux.ElementKind<A>>().toEqualTypeOf<'system' | 'container'>()
    expectTypeOf<A['DeploymentKind']>().toEqualTypeOf<'k8s' | 'aws'>()
    expectTypeOf<aux.DeploymentKind<A>>().toEqualTypeOf<'k8s' | 'aws'>()
    expectTypeOf<A['RelationKind']>().toEqualTypeOf<'http' | 'grpc'>()
    expectTypeOf<aux.RelationKind<A>>().toEqualTypeOf<'http' | 'grpc'>()
    expectTypeOf<A['Tag']>().toEqualTypeOf<'important' | 'deprecated'>()
    expectTypeOf<aux.Tag<A>>().toEqualTypeOf<'important' | 'deprecated'>()
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly ('important' | 'deprecated')[]>()

    expectTypeOf<A['MetadataKey']>().toEqualTypeOf<'version' | 'owner'>()
    expectTypeOf<aux.MetadataKey<A>>().toEqualTypeOf<'version' | 'owner'>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<{
      version?: string
      owner?: string
    }>()
  })

  it('should handle optional fields in LikeC4ModelDump', () => {
    const model = castModel({
      __: 'layouted',
      projectId: 'test-project',
      elements: {
        'e1': {},
        'e2': {},
        'e3': {},
      },
      views: {},
      deployments: {},
      specification: {
        elements: {
          'system': {},
        },
        relationships: {
          'http': {},
        },
      },
    })

    type Result = AuxFromDump<typeof model>

    expectTypeOf<Result>().toEqualTypeOf<
      aux.Aux<
        'layouted',
        'e1' | 'e2' | 'e3',
        never,
        never,
        'test-project',
        SpecAux<
          'system',
          never,
          'http',
          never,
          never
        >
      >
    >()

    expectTypeOf<PickLikeC4ViewByStage<Result>>().toEqualTypeOf<DiagramView<Result>>()
  })

  it('should return default Aux type for non-LikeC4ModelDump types', () => {
    type NotAModel = {
      foo: string
      bar: number
    }

    type Result = AuxFromDump<NotAModel>

    expectTypeOf<Result>().toEqualTypeOf<aux.Never>()
  })
})
