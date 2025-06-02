import { describe, expectTypeOf, it } from 'vitest'
import type * as aux from './aux'
import type { Aux, SpecAux } from './aux'
import * as scalar from './scalar'
import type { ViewStage } from './view-common'

function cast<
  const T extends {
    stage: ViewStage
    elementId: string[]
    deploymentId: string[]
    viewId: string[]
    projectId: string
    spec: {
      elementKind: string[]
      deploymentKind: string[]
      relationKind: string[]
      tag: string[]
      metadataKey: string[]
    }
  },
>(value: T): aux.Aux<
  T['stage'],
  T['elementId'][number],
  T['deploymentId'][number],
  T['viewId'][number],
  T['projectId'],
  aux.SpecAux<
    T['spec']['elementKind'][number],
    T['spec']['deploymentKind'][number],
    T['spec']['relationKind'][number],
    T['spec']['tag'][number],
    T['spec']['metadataKey'][number]
  >
> {
  return value as any
}

describe('Aux', () => {
  it('extract types', () => {
    type A = Aux<
      'computed',
      'e1' | 'e2' | 'e3',
      'd1' | 'd2' | 'd3',
      'v1' | 'v2' | 'v3',
      'test-project',
      SpecAux<
        'system' | 'container',
        'pod' | 'node',
        'http' | 'grpc',
        'tag1' | 'tag2',
        'k1' | 'k2'
      >
    >

    expectTypeOf<aux.Stage<A>>().toEqualTypeOf<'computed'>()
    expectTypeOf<aux.ProjectId<A>>().toEqualTypeOf<'test-project'>()
    expectTypeOf<aux.Fqn<A>>().toEqualTypeOf<'e1' | 'e2' | 'e3'>()
    expectTypeOf<aux.ElementId<A>>().toEqualTypeOf<'e1' | 'e2' | 'e3'>()
    expectTypeOf<aux.ViewId<A>>().toEqualTypeOf<'v1' | 'v2' | 'v3'>()
    expectTypeOf<aux.DeploymentId<A>>().toEqualTypeOf<'d1' | 'd2' | 'd3'>()
    expectTypeOf<aux.ElementKind<A>>().toEqualTypeOf<'system' | 'container'>()
    expectTypeOf<aux.DeploymentKind<A>>().toEqualTypeOf<'pod' | 'node'>()
    expectTypeOf<aux.RelationKind<A>>().toEqualTypeOf<'http' | 'grpc'>()
    expectTypeOf<aux.Tag<A>>().toEqualTypeOf<'tag1' | 'tag2'>()
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly ('tag1' | 'tag2')[]>()
    expectTypeOf<aux.MetadataKey<A>>().toEqualTypeOf<'k1' | 'k2'>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<{
      k1?: string
      k2?: string
    }>()

    // Check StrictTypes from aux.*
    expectTypeOf<aux.StrictFqn<A>>().toEqualTypeOf<scalar.Fqn<'e1' | 'e2' | 'e3'>>()
    expectTypeOf<aux.StrictElementId<A>>().toEqualTypeOf<scalar.Fqn<'e1' | 'e2' | 'e3'>>()
    expectTypeOf<aux.StrictDeploymentFqn<A>>().toEqualTypeOf<scalar.DeploymentFqn<'d1' | 'd2' | 'd3'>>()
    expectTypeOf<aux.StrictDeploymentId<A>>().toEqualTypeOf<scalar.DeploymentFqn<'d1' | 'd2' | 'd3'>>()

    expectTypeOf<aux.StrictViewId<A>>().toEqualTypeOf<scalar.ViewId<'v1' | 'v2' | 'v3'>>()
    expectTypeOf<aux.StrictProjectId<A>>().toEqualTypeOf<scalar.ProjectId<'test-project'>>()
    expectTypeOf<aux.StrictElementKind<A>>().toEqualTypeOf<scalar.ElementKind<'system' | 'container'>>()
    expectTypeOf<aux.StrictDeploymentKind<A>>().toEqualTypeOf<scalar.DeploymentKind<'pod' | 'node'>>()
    expectTypeOf<aux.StrictRelationKind<A>>().toEqualTypeOf<scalar.RelationshipKind<'http' | 'grpc'>>()
    expectTypeOf<aux.StrictTag<A>>().toEqualTypeOf<scalar.Tag<'tag1' | 'tag2'>>()
  })

  it('should work with Unknown', () => {
    type A = aux.Unknown

    expectTypeOf<aux.Stage<A>>().toEqualTypeOf<'layouted'>()
    expectTypeOf<aux.ProjectId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Fqn<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ElementId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ViewId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ElementKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.RelationKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tag<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.MetadataKey<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<Record<string, string | undefined>>()

    // Check StrictTypes from aux.*
    expectTypeOf<aux.StrictFqn<A>>().toEqualTypeOf<scalar.Fqn>()
    expectTypeOf<aux.StrictDeploymentFqn<A>>().toEqualTypeOf<scalar.DeploymentFqn>()
    expectTypeOf<aux.StrictViewId<A>>().toEqualTypeOf<scalar.ViewId>()
    expectTypeOf<aux.StrictProjectId<A>>().toEqualTypeOf<scalar.ProjectId>()
    expectTypeOf<aux.StrictElementKind<A>>().toEqualTypeOf<scalar.ElementKind>()
    expectTypeOf<aux.StrictDeploymentKind<A>>().toEqualTypeOf<scalar.DeploymentKind>()
    expectTypeOf<aux.StrictRelationKind<A>>().toEqualTypeOf<scalar.RelationshipKind>()
    expectTypeOf<aux.StrictTag<A>>().toEqualTypeOf<scalar.Tag>()
  })

  it('should work with NEVER', () => {
    type A = aux.Never

    expectTypeOf<aux.Stage<A>>().toBeNever()
    expectTypeOf<aux.Stage<never>>().toBeNever()
    expectTypeOf<aux.ProjectId<A>>().toBeNever()
    expectTypeOf<aux.ProjectId<never>>().toBeNever()
    expectTypeOf<aux.Fqn<A>>().toBeNever()
    expectTypeOf<aux.Fqn<never>>().toBeNever()
    expectTypeOf<aux.ViewId<A>>().toBeNever()
    expectTypeOf<aux.ViewId<never>>().toBeNever()
    expectTypeOf<aux.DeploymentId<A>>().toBeNever()
    expectTypeOf<aux.DeploymentId<never>>().toBeNever()
    expectTypeOf<aux.ElementKind<A>>().toBeNever()
    expectTypeOf<aux.DeploymentKind<A>>().toBeNever()
    expectTypeOf<aux.RelationKind<A>>().toBeNever()
    expectTypeOf<aux.Tag<A>>().toBeNever()
    expectTypeOf<aux.Tags<A>>().items.toBeNever()
    expectTypeOf<aux.MetadataKey<A>>().toBeNever()
    expectTypeOf<aux.Metadata<A>>().toBeNever()
    expectTypeOf<aux.Metadata<never>>().toBeNever()

    // Check StrictTypes from aux.*
    expectTypeOf<aux.StrictFqn<A>>().toBeNever()
    expectTypeOf<aux.StrictDeploymentFqn<A>>().toBeNever()
    expectTypeOf<aux.StrictViewId<A>>().toBeNever()
    expectTypeOf<aux.StrictProjectId<A>>().toBeNever()
    expectTypeOf<aux.StrictElementKind<A>>().toBeNever()
    expectTypeOf<aux.StrictDeploymentKind<A>>().toBeNever()
    expectTypeOf<aux.StrictRelationKind<A>>().toBeNever()
    expectTypeOf<aux.StrictTag<A>>().toBeNever()
  })

  it('should work with AnyAux (fallback to Unknown)', () => {
    type A = aux.AnyAux

    expectTypeOf<aux.Stage<A>>().toEqualTypeOf<ViewStage>()
    expectTypeOf<aux.ProjectId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Fqn<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ElementId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ViewId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentId<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ElementKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.RelationKind<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tag<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.MetadataKey<A>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<Record<string, string | undefined>>()

    // Check StrictTypes from aux.*
    expectTypeOf<aux.StrictFqn<A>>().toEqualTypeOf<scalar.Fqn<string>>()
    expectTypeOf<aux.StrictDeploymentFqn<A>>().toEqualTypeOf<scalar.DeploymentFqn<string>>()
    expectTypeOf<aux.StrictViewId<A>>().toEqualTypeOf<scalar.ViewId<string>>()
    expectTypeOf<aux.StrictProjectId<A>>().toEqualTypeOf<scalar.ProjectId<string>>()
    expectTypeOf<aux.StrictElementKind<A>>().toEqualTypeOf<scalar.ElementKind<string>>()
    expectTypeOf<aux.StrictDeploymentKind<A>>().toEqualTypeOf<scalar.DeploymentKind<string>>()
    expectTypeOf<aux.StrictRelationKind<A>>().toEqualTypeOf<scalar.RelationshipKind<string>>()
    expectTypeOf<aux.StrictTag<A>>().toEqualTypeOf<scalar.Tag<string>>()
  })

  it('should work with any', () => {
    expectTypeOf<aux.Stage<any>>().toEqualTypeOf<ViewStage>()
    expectTypeOf<aux.ProjectId<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Fqn<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ViewId<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentFqn<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.ElementKind<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.DeploymentKind<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.RelationKind<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tag<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Tags<any>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.MetadataKey<any>>().toEqualTypeOf<string>()
    expectTypeOf<aux.Metadata<any>>().toEqualTypeOf<Record<string, string | undefined>>()

    // Check StrictTypes from aux.*
    expectTypeOf<aux.StrictFqn<any>>().toEqualTypeOf<scalar.Fqn<string>>()
    expectTypeOf<aux.StrictDeploymentFqn<any>>().toEqualTypeOf<scalar.DeploymentFqn<string>>()
    expectTypeOf<aux.StrictViewId<any>>().toEqualTypeOf<scalar.ViewId<string>>()
    expectTypeOf<aux.StrictProjectId<any>>().toEqualTypeOf<scalar.ProjectId<string>>()
    expectTypeOf<aux.StrictElementKind<any>>().toEqualTypeOf<scalar.ElementKind<string>>()
    expectTypeOf<aux.StrictDeploymentKind<any>>().toEqualTypeOf<scalar.DeploymentKind<string>>()
    expectTypeOf<aux.StrictRelationKind<any>>().toEqualTypeOf<scalar.RelationshipKind<string>>()
    expectTypeOf<aux.StrictTag<any>>().toEqualTypeOf<scalar.Tag<string>>()
  })
})
