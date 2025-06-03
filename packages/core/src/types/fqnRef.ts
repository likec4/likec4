import { isString } from 'remeda'
import type { ExclusiveUnion } from './_common'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import { GlobalFqn } from './scalar'

export namespace FqnRef {
  /**
   * Reference to logical model element
   */
  export interface ElementRef<A extends AnyAux = Unknown> {
    project?: never
    model: aux.ElementId<A>
  }
  export function isElementRef<A extends AnyAux>(ref: FqnRef<A>): ref is ElementRef<A> {
    return 'model' in ref && !('project' in ref)
  }

  /**
   * Reference to imported logical model element
   */
  export interface ImportRef<A extends AnyAux = Unknown> {
    project: aux.ProjectId<A>
    model: aux.ElementId<A>
  }
  export function isImportRef<A extends AnyAux>(ref: FqnRef<A>): ref is ImportRef<A> {
    return 'project' in ref && 'model' in ref
  }

  export function flatten<A extends AnyAux>(ref: FqnRef<A>): aux.StrictFqn<A> {
    if (isString(ref)) {
      throw new Error(`Expected FqnRef, got: "${ref}"`)
    }
    if (isImportRef(ref)) {
      return GlobalFqn(ref.project, ref.model) as unknown as aux.StrictFqn<A>
    }
    if (isElementRef(ref)) {
      return ref.model as unknown as aux.StrictFqn<A>
    }
    throw new Error('Expected FqnRef.ModelRef or FqnRef.ImportRef')
  }

  export type ModelRef<A extends AnyAux = Unknown> = ImportRef<A> | ElementRef<A>
  export function isModelRef<A extends AnyAux>(ref: FqnRef<A>): ref is ModelRef<A> {
    return isElementRef(ref) || isImportRef(ref)
  }

  /**
   * Represents a reference to an instance within a deployment.
   *
   * @template D - The type representing the deployment fqn. Defaults to `Fqn`.
   * @template M - The type representing the model fqn. Defaults to `Fqn`.
   *
   * @property {D} deployment - TThe fully qualified name (FQN) of the deployed instance.
   * @property {M} element - The element reference within the deployment.
   */
  export interface InsideInstanceRef<A extends AnyAux = Unknown> {
    deployment: aux.DeploymentId<A>
    element: aux.ElementId<A>
  }
  export function isInsideInstanceRef<A extends AnyAux>(ref: FqnRef<A>): ref is InsideInstanceRef<A> {
    return 'deployment' in ref && 'element' in ref
  }

  /**
   * Represents a reference to a deployment element.
   *
   * @template F - The type of the fully qualified name (FQN) of the deployment element. Defaults to `Fqn`.
   * @property {F} deployment - The fully qualified name (FQN) of the deployment element.
   */
  export interface DeploymentElementRef<A extends AnyAux> {
    deployment: aux.DeploymentId<A>
    element?: never
  }
  export function isDeploymentElementRef<A extends AnyAux>(ref: FqnRef<A>): ref is DeploymentElementRef<A> {
    return 'deployment' in ref && !('element' in ref)
  }

  export type DeploymentRef<A extends AnyAux> = DeploymentElementRef<A> | InsideInstanceRef<A>
  export function isDeploymentRef<A extends AnyAux>(ref: FqnRef<A>): ref is DeploymentRef<A> {
    return isDeploymentElementRef(ref) || isInsideInstanceRef(ref)
  }
}

export type FqnRef<A extends AnyAux = Unknown> = ExclusiveUnion<{
  DeploymentRef: FqnRef.DeploymentRef<A>
  ModelRef: FqnRef.ModelRef<A>
}>
