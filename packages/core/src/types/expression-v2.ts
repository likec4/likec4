import { invariant } from '../errors'
import type { ExclusiveUnion } from './_common'
import type { DeploymentRef as DeploymentModelRef, PredicateSelector } from './deployments'
import type { Fqn } from './element'

export namespace FqnRef {
  /**
   * Reference to descendant of deployed instance
   */
  export type InsideInstanceRef = {
    deployment: Fqn
    element: Fqn
  }
  export const isInsideInstanceRef = (ref: FqnRef): ref is InsideInstanceRef => {
    return 'deployment' in ref && 'element' in ref
  }

  /**
   * Reference to deployment element
   */
  export type DeploymentElementRef = {
    deployment: Fqn
  }
  export const isDeploymentElementRef = (ref: FqnRef): ref is DeploymentElementRef => {
    return 'deployment' in ref && !('element' in ref)
  }

  export type DeploymentRef = DeploymentElementRef | InsideInstanceRef
  export const isDeploymentRef = (ref: FqnRef): ref is DeploymentRef => {
    return !isModelRef(ref)
  }

  /**
   * Reference to logical model element
   */
  export type ModelRef = {
    model: Fqn
  }
  export const isModelRef = (ref: FqnRef): ref is ModelRef => {
    return 'model' in ref
  }

  export const toDeploymentRef = (ref: FqnRef): DeploymentModelRef => {
    invariant(isDeploymentRef(ref), 'Expected DeploymentRef')
    return isInsideInstanceRef(ref)
      ? {
        id: ref.deployment,
        element: ref.element
      }
      : {
        id: ref.deployment
      }
  }
}

export type FqnRef = ExclusiveUnion<{
  InsideInstanceRef: FqnRef.InsideInstanceRef
  DeploymentRef: FqnRef.DeploymentRef
  ModelRef: FqnRef.ModelRef
}>

export namespace FqnExpr {
  export type Wildcard = {
    wildcard: true
  }
  export const isWildcard = (expr: ExpressionV2): expr is Wildcard => {
    return 'wildcard' in expr && expr.wildcard === true
  }

  export type ModelRef = {
    ref: FqnRef.ModelRef
    selector?: PredicateSelector
  }
  export const isModelRef = (ref: ExpressionV2): ref is ModelRef => {
    return 'ref' in ref && FqnRef.isModelRef(ref.ref)
  }

  export type DeploymentRef = {
    ref: FqnRef.DeploymentRef | FqnRef.InsideInstanceRef
    selector?: PredicateSelector
  }
  export const isDeploymentRef = (ref: ExpressionV2): ref is FqnExpr.DeploymentRef => {
    return 'ref' in ref && FqnRef.isDeploymentRef(ref.ref)
  }

  export type Ref = ExclusiveUnion<{
    ModelRef: ModelRef
    DeploymentRef: DeploymentRef
  }>
}

export type FqnExpr = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef
  DeploymentRef: FqnExpr.DeploymentRef
}>

export namespace RelationExpr {
  export type Direct = {
    source: FqnExpr
    target: FqnExpr
    isBidirectional?: boolean
  }
  export const isDirect = (expr: ExpressionV2): expr is Direct => {
    return 'source' in expr && 'target' in expr
  }
  export type Incoming = {
    incoming: FqnExpr
  }
  export const isIncoming = (expr: ExpressionV2): expr is Incoming => {
    return 'incoming' in expr
  }
  export type Outgoing = {
    outgoing: FqnExpr
  }
  export const isOutgoing = (expr: ExpressionV2): expr is Outgoing => {
    return 'outgoing' in expr
  }
  export type InOut = {
    inout: FqnExpr
  }
  export const isInOut = (expr: ExpressionV2): expr is InOut => {
    return 'inout' in expr
  }
}

export type RelationExpr = ExclusiveUnion<{
  Direct: RelationExpr.Direct
  Incoming: RelationExpr.Incoming
  Outgoing: RelationExpr.Outgoing
  InOut: RelationExpr.InOut
}>

// ExpressionV2
export type ExpressionV2 = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef
  DeploymentRef: FqnExpr.DeploymentRef
  Direct: RelationExpr.Direct
  Incoming: RelationExpr.Incoming
  Outgoing: RelationExpr.Outgoing
  InOut: RelationExpr.InOut
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

// export const isElement = (expr: FqnExpression): expr is FqnExpression.Element => {
//   return FqnExpression.Element.isRef(expr)
//     || FqnExpression.Element.isWildcard(expr)
// }

// export const isRelation = (expr: FqnExpression): expr is FqnExpression.Relation => {
//   return FqnExpression.Relation.isDirect(expr)
//     || FqnExpression.Relation.isIncoming(expr)
//     || FqnExpression.Relation.isOutgoing(expr)
//     || FqnExpression.Relation.isInOut(expr)
// }
// }

// export type FqnExpression = ExclusiveUnion<{
//   Ref: FqnExpression.Element.Ref
//   Wildcard: FqnExpression.Element.Wildcard
//   Direct: FqnExpression.Relation.Direct
//   Incoming: FqnExpression.Relation.Incoming
//   Outgoing: FqnExpression.Relation.Outgoing
//   InOut: FqnExpression.Relation.InOut
// }>
