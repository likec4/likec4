import { invariant } from '../errors'
import type { ExclusiveUnion, ProjectId } from './_common'
import type { DeploymentRef as DeploymentModelRef, PredicateSelector } from './deployments'
import type { WhereOperator } from './operators'
import { type Fqn, GlobalFqn } from './scalars'

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
    return !isModelRef(ref) && !isImportRef(ref)
  }

  /**
   * Reference to logical model element
   */
  export type ModelRef<F = Fqn> = {
    model: F
  }
  export const isModelRef = (ref: FqnRef): ref is ModelRef => {
    return 'model' in ref && !('project' in ref)
  }

  /**
   * Reference to imported logical model element
   */
  export type ImportRef<F = Fqn> = {
    project: ProjectId
    model: F
  }
  export const isImportRef = (ref: FqnRef): ref is ImportRef => {
    return 'project' in ref && 'model' in ref
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

  export const toModelFqn = (ref: FqnRef): Fqn => {
    if (isImportRef(ref)) {
      return GlobalFqn(ref.project, ref.model)
    }
    if (isModelRef(ref)) {
      return ref.model
    }
    throw new Error('Expected FqnRef.ModelRef or FqnRef.ImportRef')
  }
}

export type FqnRef<D = Fqn, M = Fqn> = ExclusiveUnion<{
  InsideInstanceRef: FqnRef.InsideInstanceRef<D, M>
  DeploymentRef: FqnRef.DeploymentRef<D>
  ModelRef: FqnRef.ModelRef<M>
  ImportRef: FqnRef.ImportRef<M>
}>

export namespace FqnExpr {
  export type Wildcard = {
    wildcard: true
  }
  export const isWildcard = (expr: ExpressionV2): expr is FqnExpr.Wildcard => {
    return 'wildcard' in expr && expr.wildcard === true
  }

  export type ModelRef<M = Fqn> = {
    ref: FqnRef.ModelRef<M> | FqnRef.ImportRef<M>
    selector?: PredicateSelector
  }
  export const isModelRef = (ref: ExpressionV2): ref is FqnExpr.ModelRef => {
    return 'ref' in ref && (FqnRef.isModelRef(ref.ref) || FqnRef.isImportRef(ref.ref))
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

  export type Where<D = Fqn, M = Fqn> = {
    where: {
      expr: ExclusiveUnion<{
        Wildcard: Wildcard
        ModelRef: ModelRef<M>
        DeploymentRef: DeploymentRef<D, M>
      }>
      condition: WhereOperator<string, string>
    }
  }

  export const isWhere = (expr: ExpressionV2): expr is FqnExpr.Where => {
    return 'where' in expr &&
      (isWildcard(expr.where.expr) || isModelRef(expr.where.expr) ||
        isDeploymentRef(expr.where.expr))
  }

  export const is = (expr: ExpressionV2): expr is FqnExpr => {
    return isWildcard(expr)
      || isModelRef(expr)
      || isDeploymentRef(expr)
  }
}

export type FqnExpr<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<M>
  DeploymentRef: FqnExpr.DeploymentRef<D, M>
}>

export type FqnExprOrWhere<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<M>
  DeploymentRef: FqnExpr.DeploymentRef<D, M>
  Where: FqnExpr.Where<D, M>
}>

export namespace RelationExpr {
  export type Endpoint<D = Fqn, M = Fqn> = FqnExpr.Where<D, M>['where']['expr']

  export type Direct<D = Fqn, M = Fqn> = {
    source: Endpoint<D, M>
    target: Endpoint<D, M>
    isBidirectional?: boolean
  }
  export const isDirect = (expr: ExpressionV2): expr is RelationExpr.Direct => {
    return 'source' in expr && 'target' in expr
  }
  export type Incoming<D = Fqn, M = Fqn> = {
    incoming: Endpoint<D, M>
  }
  export const isIncoming = (expr: ExpressionV2): expr is RelationExpr.Incoming => {
    return 'incoming' in expr
  }
  export type Outgoing<D = Fqn, M = Fqn> = {
    outgoing: Endpoint<D, M>
  }
  export const isOutgoing = (expr: ExpressionV2): expr is RelationExpr.Outgoing => {
    return 'outgoing' in expr
  }
  export type InOut<D = Fqn, M = Fqn> = {
    inout: Endpoint<D, M>
  }
  export const isInOut = (expr: ExpressionV2): expr is RelationExpr.InOut => {
    return 'inout' in expr
  }
  export type Where<D = Fqn, M = Fqn> = {
    where: {
      expr: ExclusiveUnion<{
        Direct: RelationExpr.Direct<D, M>
        Incoming: RelationExpr.Incoming<D, M>
        Outgoing: RelationExpr.Outgoing<D, M>
        InOut: RelationExpr.InOut<D, M>
      }>
      condition: WhereOperator<string, string>
    }
  }
  export const isWhere = (expr: ExpressionV2): expr is RelationExpr.Where => {
    return 'where' in expr &&
      (isDirect(expr.where.expr) || isIncoming(expr.where.expr) || isOutgoing(expr.where.expr) ||
        isInOut(expr.where.expr))
  }

  export const is = (expr: ExpressionV2): expr is RelationExpr => {
    return isDirect(expr)
      || isIncoming(expr)
      || isOutgoing(expr)
      || isInOut(expr)
  }
}

export type RelationExpr<D = Fqn, M = Fqn> = ExclusiveUnion<{
  Direct: RelationExpr.Direct<D, M>
  Incoming: RelationExpr.Incoming<D, M>
  Outgoing: RelationExpr.Outgoing<D, M>
  InOut: RelationExpr.InOut<D, M>
}>

export type RelationExprOrWhere<D = Fqn, M = Fqn> = ExclusiveUnion<{
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
  Where: ExpressionV2.Where<D, M>
}>

export namespace ExpressionV2 {
  export type Where<D = Fqn, M = Fqn> = FqnExpr.Where<D, M> | RelationExpr.Where<D, M>
  // export type Where<D = Fqn, M = Fqn> = {
  //   where: ExclusiveUnion<{
  //     Fqn: FqnExpr.Where<D, M>['where']['expr']
  //     Relation: RelationExpr.Where<D, M>['where']['expr']
  //   }>
  //   condition: WhereOperator<string, string>
  // }

  export const isWhere = (expr: ExpressionV2): expr is ExpressionV2.Where => {
    return 'where' in expr
  }

  export const isRelationWhere = (expr: ExpressionV2): expr is RelationExpr.Where => {
    return RelationExpr.isWhere(expr)
  }

  export const isFqnExprWhere = (expr: ExpressionV2): expr is FqnExpr.Where => {
    return FqnExpr.isWhere(expr)
  }

  export const isFqnExpr = (expr: ExpressionV2): expr is FqnExpr => {
    return FqnExpr.is(expr as any)
  }

  export const isRelation = (expr: ExpressionV2): expr is RelationExpr => {
    return RelationExpr.is(expr as any)
  }
}
