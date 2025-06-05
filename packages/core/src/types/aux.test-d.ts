import { describe, expectTypeOf, it } from 'vitest'
import type { Aux, SpecAux } from './aux'
import * as aux from './aux'
import * as auxloose from './aux.loose'
import type { ModelStage } from './const'
import * as scalar from './scalar'

function expectAuxTypes<A>() {
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
    metadataKey: aux.MetadataKey<A>
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
      metadataKey: 'k1' | 'k2'
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
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly ('tag1' | 'tag2')[]>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<{
      k1?: string
      k2?: string
    }>()

    expectTypeOf<auxloose.AllKinds<A>>().toEqualTypeOf<
      | 'system'
      | 'container'
      | 'pod'
      | 'node'
      | 'http'
      | 'grpc'
      | string & Record<never, never>
    >()
  })

  it('replace with never missing tupes', () => {
    type A = Aux<
      'computed',
      'e1' | 'e2' | 'e3',
      never,
      'v1' | 'v2' | 'v3',
      never,
      SpecAux<
        'system' | 'container',
        never,
        'http' | 'grpc',
        'tag1' | 'tag2',
        never
      >
    >

    expectAuxTypes<A>().toEqualTypeOf<{
      stage: 'computed'
      projectId: never
      fqn: scalar.Fqn<'e1' | 'e2' | 'e3'>
      elementId: 'e1' | 'e2' | 'e3'
      viewId: 'v1' | 'v2' | 'v3'
      deploymentId: never
      deploymentFqn: never
      elementKind: 'system' | 'container'
      deploymentKind: never
      relationKind: 'http' | 'grpc'
      tag: 'tag1' | 'tag2'
      metadataKey: never
      strict: {
        projectId: never
        fqn: scalar.Fqn<'e1' | 'e2' | 'e3'>
        deploymentFqn: never
        viewId: scalar.ViewId<'v1' | 'v2' | 'v3'>
        elementKind: scalar.ElementKind<'system' | 'container'>
        deploymentKind: never
        relationKind: scalar.RelationshipKind<'http' | 'grpc'>
        tag: scalar.Tag<'tag1' | 'tag2'>
      }
    }>()
  })

  it('should work with Unknown', () => {
    type A = aux.Unknown
    expectAuxTypes<A>().toEqualTypeOf<{
      stage: 'computed' | 'layouted'
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
      metadataKey: string
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
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<Record<string, string>>()
  })

  it('should work with NEVER', () => {
    type A = aux.Never
    expectAuxTypes<A>().toEqualTypeOf<{
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
      metadataKey: never
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
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly never[]>()
    expectTypeOf<aux.Metadata<A>>().toBeNever()
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
      metadataKey: never
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
    expectTypeOf<aux.Tags<never>>().toEqualTypeOf<readonly never[]>()
    expectTypeOf<aux.Metadata<never>>().toBeNever()
  })

  it('should work with Any (fallback to Unknown)', () => {
    type A = aux.Any
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
      metadataKey: string
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
    expectTypeOf<aux.Tags<A>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.Metadata<A>>().toEqualTypeOf<Record<string, string>>()
  })

  it('should work with any', () => {
    expectAuxTypes<any>().toEqualTypeOf<{
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
      metadataKey: string
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
    expectTypeOf<aux.Tags<any>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<aux.Metadata<any>>().toEqualTypeOf<Record<string, string>>()

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
