import { invariant } from '../errors'
import type { ExclusiveUnion } from './_common'
import type { DeploymentRef as DeploymentModelRef, PredicateSelector } from './deployments'
import type { Fqn } from './element'
import type { WhereOperator } from './operators'

export namespace FqnRef {
  /**
   * Represents a reference to an instance within a deployment.
   *
   * @template D - The type representing the deployment fqn. Defaults to `Fqn`.
   * @template M - The type representing the model fqn. Defaults to `Fqn`.
   *
   * @property {D} deployment - TThe fully qualified name (FQN) of the deployed instance.
   * @property {M} element - The element reference within the deployment.
   */
  export type InsideInstanceRef<D = Fqn, M = Fqn> = {
    deployment: D
    element: M
  }
  export const isInsideInstanceRef = (ref: FqnRef): ref is InsideInstanceRef => {
    return 'deployment' in ref && 'element' in ref
  }

  /**
   * Represents a reference to a deployment element.
   *
   * @template F - The type of the fully qualified name (FQN) of the deployment element. Defaults to `Fqn`.
   * @property {F} deployment - The fully qualified name (FQN) of the deployment element.
   */
  export type DeploymentElementRef<F = Fqn> = {
    deployment: F
  }
  export const isDeploymentElementRef = (ref: FqnRef): ref is DeploymentElementRef => {
    return 'deployment' in ref && !('element' in ref)
  }

  export type DeploymentRef<D = Fqn, M = Fqn> = DeploymentElementRef<D> | InsideInstanceRef<D, M>
  export const isDeploymentRef = (ref: FqnRef): ref is DeploymentRef => {
    return !isModelRef(ref)
  }

  /**
   * Reference to logical model element
   */
  export type ModelRef<F = Fqn> = {
    model: F
  }
  export const isModelRef = (ref: FqnRef): ref is ModelRef => {
    return 'model' in ref
  }

  export const toDeploymentRef = (ref: FqnRef): DeploymentModelRef => {
    invariant(isDeploymentRef(ref), 'Expected DeploymentRef')
    return isInsideInstanceRef(ref)
      ? {
        id: ref.deployment,
        element: ref.element,
      }
      : {
        id: ref.deployment,
      }
  }
}

export type FqnRef<D = Fqn, M = Fqn> = ExclusiveUnion<{
  InsideInstanceRef: FqnRef.InsideInstanceRef<D, M>
  DeploymentRef: FqnRef.DeploymentRef<D>
  ModelRef: FqnRef.ModelRef<M>
}>

export namespace FqnExpr {
  export type Wildcard = {
    wildcard: true
  }
  export const isWildcard = (expr: ExpressionV2): expr is Wildcard => {
    return 'wildcard' in expr && expr.wildcard === true
  }

  export type ModelRef<M = Fqn> = {
    ref: FqnRef.ModelRef<M>
    selector?: PredicateSelector
  }
  export const isModelRef = (ref: ExpressionV2): ref is ModelRef => {
    return 'ref' in ref && FqnRef.isModelRef(ref.ref)
  }

  export type DeploymentRef<D = Fqn, M = Fqn> = {
    ref: FqnRef.DeploymentRef<D> | FqnRef.InsideInstanceRef<D, M>
    selector?: PredicateSelector
  }
  export const isDeploymentRef = (ref: ExpressionV2): ref is FqnExpr.DeploymentRef => {
    return 'ref' in ref && FqnRef.isDeploymentRef(ref.ref)
  }

  export type NonWildcard<D = Fqn, M = Fqn> = ExclusiveUnion<{
    ModelRef: ModelRef<M>
    DeploymentRef: DeploymentRef<D, M>
  }>
}

export type FqnExpr<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<M>
  DeploymentRef: FqnExpr.DeploymentRef<D, M>
}>

export namespace RelationExpr {
  export type Direct<D = Fqn, M = Fqn> = {
    source: FqnExpr<D, M>
    target: FqnExpr<D, M>
    isBidirectional?: boolean
  }
  export const isDirect = (expr: ExpressionV2): expr is Direct => {
    return 'source' in expr && 'target' in expr
  }
  export type Incoming<D = Fqn, M = Fqn> = {
    incoming: FqnExpr<D, M>
  }
  export const isIncoming = (expr: ExpressionV2): expr is Incoming => {
    return 'incoming' in expr
  }
  export type Outgoing<D = Fqn, M = Fqn> = {
    outgoing: FqnExpr<D, M>
  }
  export const isOutgoing = (expr: ExpressionV2): expr is Outgoing => {
    return 'outgoing' in expr
  }
  export type InOut<D = Fqn, M = Fqn> = {
    inout: FqnExpr<D, M>
  }
  export const isInOut = (expr: ExpressionV2): expr is InOut => {
    return 'inout' in expr
  }
  export type Where<D = Fqn, M = Fqn> = {
    where: {
      expr: ExpressionV2<D, M>
      condition: WhereOperator<string, string>
    }
  }
  export const isWhere = (expr: ExpressionV2): expr is Where => {
    return 'where' in expr
  }
}

export type RelationExpr<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Direct: RelationExpr.Direct<D, M>
  Incoming: RelationExpr.Incoming<D, M>
  Outgoing: RelationExpr.Outgoing<D, M>
  InOut: RelationExpr.InOut<D, M>
  Where: RelationExpr.Where<D, M>
}>

/**
 * Represents a version 2 expression which can be one of several types.
 *
 * @template D - The type for the deployment FQN, defaults to `Fqn`.
 * @template M - The type for the model FQN, defaults to `Fqn`.
 */
export type ExpressionV2<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<M>
  DeploymentRef: FqnExpr.DeploymentRef<D, M>
  Direct: RelationExpr.Direct<D, M>
  Incoming: RelationExpr.Incoming<D, M>
  Outgoing: RelationExpr.Outgoing<D, M>
  InOut: RelationExpr.InOut<D, M>
  RelationPredicateOrWhere: RelationExpr.Where<D, M>
}>

export namespace ExpressionV2 {
  export const isFqnExpr = (expr: ExpressionV2): expr is FqnExpr => {
    return FqnExpr.isWildcard(expr)
      || FqnExpr.isModelRef(expr)
      || FqnExpr.isDeploymentRef(expr)
  }

  export const isRelation = (expr: ExpressionV2): expr is RelationExpr => {
    return RelationExpr.isDirect(expr)
      || RelationExpr.isIncoming(expr)
      || RelationExpr.isOutgoing(expr)
      || RelationExpr.isInOut(expr)
  }
}
