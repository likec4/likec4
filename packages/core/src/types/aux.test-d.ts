import { describe, expectTypeOf, it } from 'vitest'
import type * as aux from './aux'
import type { Any, Aux, SpecAux } from './aux'
import type { ModelStage } from './const'
import * as scalar from './scalar'

function expectAuxTypes<A extends Any>() {
  return expectTypeOf<{
    stage: aux.Stage<A>
    projectId: aux.ProjectId<A>
    fqn: aux.Fqn<A>
    elementId: aux.ElementId<A>
    viewId: aux.ViewId<A>
    deploymentId: aux.DeploymentId<A>
    deploymentFqn: aux.DeploymentFqn<A>
    elementKind: aux.ElementKind<A>
    deploymentKind: aux.DeploymentKind<A>
    relationKind: aux.RelationKind<A>
    tag: aux.Tag<A>
    tags: aux.Tags<A>
    metadataKey: aux.MetadataKey<A>
    metadata: aux.Metadata<A>
    strict: {
      projectId: aux.StrictProjectId<A>
      fqn: aux.StrictFqn<A>
      deploymentFqn: aux.StrictDeploymentFqn<A>
      viewId: aux.StrictViewId<A>
      elementKind: aux.StrictElementKind<A>
      deploymentKind: aux.StrictDeploymentKind<A>
      relationKind: aux.StrictRelationKind<A>
      tag: aux.StrictTag<A>
    }
  }>()
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

    expectAuxTypes<A>().toEqualTypeOf<{
      stage: 'computed'
      projectId: 'test-project'
      fqn: scalar.Fqn<'e1' | 'e2' | 'e3'>
      elementId: 'e1' | 'e2' | 'e3'
      viewId: 'v1' | 'v2' | 'v3'
      deploymentId: 'd1' | 'd2' | 'd3'
      deploymentFqn: scalar.DeploymentFqn<'d1' | 'd2' | 'd3'>
      elementKind: 'system' | 'container'
      deploymentKind: 'pod' | 'node'
      relationKind: 'http' | 'grpc'
      tag: 'tag1' | 'tag2'
      tags: readonly ('tag1' | 'tag2')[]
      metadataKey: 'k1' | 'k2'
      metadata: {
        k1?: string
        k2?: string
      }
      strict: {
        projectId: scalar.ProjectId<'test-project'>
        fqn: scalar.Fqn<'e1' | 'e2' | 'e3'>
        deploymentFqn: scalar.DeploymentFqn<'d1' | 'd2' | 'd3'>
        viewId: scalar.ViewId<'v1' | 'v2' | 'v3'>
        elementKind: scalar.ElementKind<'system' | 'container'>
        deploymentKind: scalar.DeploymentKind<'pod' | 'node'>
        relationKind: scalar.RelationshipKind<'http' | 'grpc'>
        tag: scalar.Tag<'tag1' | 'tag2'>
      }
    }>()
  })

  it('should work with Unknown', () => {
    type A = aux.Unknown
    expectAuxTypes<A>().toEqualTypeOf<{
      stage: 'layouted' | 'computed'
      projectId: string
      fqn: scalar.Fqn<string>
      elementId: string
      viewId: string
      deploymentId: string
      deploymentFqn: scalar.DeploymentFqn<string>
      elementKind: string
      deploymentKind: string
      relationKind: string
      tag: string
      tags: readonly string[]
      metadataKey: string
      metadata: Record<string, string | undefined>
      strict: {
        projectId: scalar.ProjectId<string>
        fqn: scalar.Fqn<string>
        deploymentFqn: scalar.DeploymentFqn<string>
        viewId: scalar.ViewId<string>
        elementKind: scalar.ElementKind<string>
        deploymentKind: scalar.DeploymentKind<string>
        relationKind: scalar.RelationshipKind<string>
        tag: scalar.Tag<string>
      }
    }>()
  })

  it('should work with NEVER', () => {
    // type A = aux.Never
    // expectAuxTypes<Aux>().toEqualTypeOf<{
    //   stage: never
    //   projectId: never
    //   fqn: never
    //   elementId: never
    //   viewId: never
    //   deploymentId: never
    //   deploymentFqn: never
    //   elementKind: never
    //   deploymentKind: never
    //   relationKind: never
    //   tag: never
    //   tags: never
    //   metadataKey: never
    //   metadata: never,
    //   strict: {
    //     projectId: never
    //     fqn: never
    //     deploymentFqn: never
    //     viewId: never
    //     elementKind: never
    //     deploymentKind: never
    //     relationKind: never
    //     tag: never
    //   }
    // }>()
    expectAuxTypes<never>().toEqualTypeOf<{
      stage: never
      projectId: never
      fqn: never
      elementId: never
      viewId: never
      deploymentId: never
      deploymentFqn: never
      elementKind: never
      deploymentKind: never
      relationKind: never
      tag: never
      tags: never
      metadataKey: never
      metadata: never
      strict: {
        projectId: never
        fqn: never
        deploymentFqn: never
        viewId: never
        elementKind: never
        deploymentKind: never
        relationKind: never
        tag: never
      }
    }>()
  })

  it('should work with AnyAux (fallback to Unknown)', () => {
    type A = aux.AnyAux
    expectAuxTypes<A>().toEqualTypeOf<{
      stage: ModelStage
      projectId: string
      fqn: scalar.Fqn<string>
      elementId: string
      viewId: string
      deploymentId: string
      deploymentFqn: scalar.DeploymentFqn<string>
      elementKind: string
      deploymentKind: string
      relationKind: string
      tag: string
      tags: readonly string[]
      metadataKey: string
      metadata: Record<string, string | undefined>
      strict: {
        projectId: scalar.ProjectId<string>
        fqn: scalar.Fqn<string>
        deploymentFqn: scalar.DeploymentFqn<string>
        viewId: scalar.ViewId<string>
        elementKind: scalar.ElementKind<string>
        deploymentKind: scalar.DeploymentKind<string>
        relationKind: scalar.RelationshipKind<string>
        tag: scalar.Tag<string>
      }
    }>()
  })

  // it('should work with any', () => {
  //   expectAuxTypes<any>().toEqualTypeOf<{
  //     stage: ModelStage
  //     projectId: string
  //     fqn: scalar.Fqn<string>
  //     elementId: string
  //     viewId: string
  //     deploymentId: string
  //     deploymentFqn: scalar.DeploymentFqn<string>
  //     elementKind: string
  //     deploymentKind: string
  //     relationKind: string
  //     tag: string
  //     tags: readonly string[]
  //     metadataKey: string
  //     metadata: Record<string, string | undefined>
  //   }>()
  //   expectTypeOf<aux.Stage<any>>().toEqualTypeOf<ModelStage>()
  //   expectTypeOf<aux.ProjectId<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.Fqn<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.ViewId<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.DeploymentFqn<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.ElementKind<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.DeploymentKind<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.RelationKind<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.Tag<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.Tags<any>>().toEqualTypeOf<readonly string[]>()
  //   expectTypeOf<aux.MetadataKey<any>>().toEqualTypeOf<string>()
  //   expectTypeOf<aux.Metadata<any>>().toEqualTypeOf<Record<string, string | undefined>>()

  //   // Check StrictTypes from aux.*
  //   expectTypeOf<aux.StrictFqn<any>>().toEqualTypeOf<scalar.Fqn<string>>()
  //   expectTypeOf<aux.StrictDeploymentFqn<any>>().toEqualTypeOf<scalar.DeploymentFqn<string>>()
  //   expectTypeOf<aux.StrictViewId<any>>().toEqualTypeOf<scalar.ViewId<string>>()
  //   expectTypeOf<aux.StrictProjectId<any>>().toEqualTypeOf<scalar.ProjectId<string>>()
  //   expectTypeOf<aux.StrictElementKind<any>>().toEqualTypeOf<scalar.ElementKind<string>>()
  //   expectTypeOf<aux.StrictDeploymentKind<any>>().toEqualTypeOf<scalar.DeploymentKind<string>>()
  //   expectTypeOf<aux.StrictRelationKind<any>>().toEqualTypeOf<scalar.RelationshipKind<string>>()
  //   expectTypeOf<aux.StrictTag<any>>().toEqualTypeOf<scalar.Tag<string>>()
  // })
})
