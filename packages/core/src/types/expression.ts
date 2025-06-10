import type { ExclusiveUnion } from './_common'
import type * as aux from './aux'
import type { AnyAux } from './aux'
import { FqnRef } from './fqnRef'
import type { WhereOperator } from './operators'
import { type Icon } from './scalar'
import type {
  BorderStyle,
  Color,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
} from './styles'

export type PredicateSelector =
  | 'children' // ele.*
  | 'expanded' // ele._
  | 'descendants' // ele.**

export namespace FqnExpr {
  export type Wildcard = {
    wildcard: true
  }
  export function isWildcard<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Wildcard {
    return 'wildcard' in expr && expr.wildcard === true
  }

  export interface ModelRef<M extends AnyAux = AnyAux> {
    ref: FqnRef.ModelRef<M>
    selector?: PredicateSelector
  }
  export function isModelRef<A extends AnyAux>(ref: Expression<A>): ref is FqnExpr.ModelRef<A> {
    return 'ref' in ref && FqnRef.isModelRef(ref.ref)
  }

  export interface DeploymentRef<A extends AnyAux = AnyAux> {
    ref: FqnRef.DeploymentRef<A>
    selector?: PredicateSelector
  }
  export function isDeploymentRef<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.DeploymentRef<A> {
    return 'ref' in expr && FqnRef.isDeploymentRef(expr.ref)
  }

  export interface ElementKindExpr<A extends AnyAux = AnyAux> {
    elementKind: aux.ElementKind<A>
    isEqual: boolean
  }
  export function isElementKindExpr<A extends AnyAux>(expr: Expression<A>): expr is ElementKindExpr<A> {
    return 'elementKind' in expr && 'isEqual' in expr
  }

  export interface ElementTagExpr<A extends AnyAux = AnyAux> {
    elementTag: aux.Tag<A>
    isEqual: boolean
  }
  export function isElementTagExpr<A extends AnyAux>(expr: Expression<A>): expr is ElementTagExpr<A> {
    return 'elementTag' in expr && 'isEqual' in expr
  }

  export type NonWildcard<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    ModelRef: ModelRef<A>
    DeploymentRef: DeploymentRef<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
  }>

  export interface Where<A extends AnyAux = AnyAux> {
    where: {
      expr: ExclusiveUnion<{
        Wildcard: Wildcard
        ModelRef: ModelRef<A>
        DeploymentRef: DeploymentRef<A>
        ElementKind: ElementKindExpr<A>
        ElementTag: ElementTagExpr<A>
      }>
      condition: WhereOperator<A>
    }
  }

  export function isWhere<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Where<A> {
    return 'where' in expr && is(expr.where.expr)
  }

  export interface Custom<A extends AnyAux = AnyAux> {
    custom: {
      expr: OrWhere<A>
      title?: string
      description?: string
      technology?: string
      notation?: string
      shape?: ElementShape
      color?: Color
      icon?: Icon
      border?: BorderStyle
      opacity?: number
      navigateTo?: aux.StrictViewId<A>
      multiple?: boolean
      size?: ShapeSize
      padding?: ShapeSize
      textSize?: ShapeSize
    }
  }

  export function isCustom<A extends AnyAux>(expr: Expression<A>): expr is Custom<A> {
    return 'custom' in expr && (is(expr.custom.expr) || isWhere(expr.custom.expr))
  }

  export function is<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr<A> {
    return isWildcard(expr)
      || isModelRef(expr)
      || isDeploymentRef(expr)
      || isElementKindExpr(expr)
      || isElementTagExpr(expr)
  }

  export type OrWhere<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard
    ModelRef: FqnExpr.ModelRef<A>
    DeploymentRef: FqnExpr.DeploymentRef<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
    Where: FqnExpr.Where<A>
  }>

  export type Any<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: Wildcard
    ModelRef: ModelRef<A>
    DeploymentRef: DeploymentRef<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
    Where: Where<A>
    Custom: Custom<A>
  }>

  export function unwrap<A extends AnyAux>(
    expr: FqnExpr.Any<A>,
  ): Wildcard | ModelRef<A> | DeploymentRef<A> | ElementKindExpr<A> | ElementTagExpr<A> {
    if (isCustom(expr)) {
      expr = expr.custom.expr
    }
    if (isWhere(expr)) {
      expr = expr.where.expr
    }
    return expr
  }
}

export type FqnExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<A>
  DeploymentRef: FqnExpr.DeploymentRef<A>
  ElementKind: FqnExpr.ElementKindExpr<A>
  ElementTag: FqnExpr.ElementTagExpr<A>
}>

export namespace RelationExpr {
  export type Endpoint<A extends AnyAux = AnyAux> = FqnExpr.Where<A>['where']['expr']

  export interface Direct<A extends AnyAux = AnyAux> {
    source: Endpoint<A>
    target: Endpoint<A>
    isBidirectional?: boolean
  }
  export function isDirect<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Direct<A> {
    return 'source' in expr && 'target' in expr
  }
  export interface Incoming<A extends AnyAux = AnyAux> {
    incoming: Endpoint<A>
  }
  export function isIncoming<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Incoming<A> {
    return 'incoming' in expr
  }
  export interface Outgoing<A extends AnyAux = AnyAux> {
    outgoing: Endpoint<A>
  }
  export function isOutgoing<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Outgoing<A> {
    return 'outgoing' in expr
  }
  export interface InOut<A extends AnyAux = AnyAux> {
    inout: Endpoint<A>
  }
  export function isInOut<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.InOut<A> {
    return 'inout' in expr
  }
  export interface Where<A extends AnyAux = AnyAux> {
    where: {
      expr: ExclusiveUnion<{
        Direct: RelationExpr.Direct<A>
        Incoming: RelationExpr.Incoming<A>
        Outgoing: RelationExpr.Outgoing<A>
        InOut: RelationExpr.InOut<A>
      }>
      condition: WhereOperator<A>
    }
  }
  export function isWhere<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Where<A> {
    return 'where' in expr &&
      (isDirect(expr.where.expr) || isIncoming(expr.where.expr) || isOutgoing(expr.where.expr) ||
        isInOut(expr.where.expr))
  }

  export interface Custom<A extends AnyAux = AnyAux> {
    customRelation: {
      expr: OrWhere<A>
      title?: string
      description?: string
      technology?: string
      notation?: string
      // Link to dynamic view
      navigateTo?: aux.StrictViewId<A>
      // Notes for walkthrough
      notes?: string
      color?: Color
      line?: RelationshipLineType
      head?: RelationshipArrowType
      tail?: RelationshipArrowType
    }
  }

  export function isCustom<A extends AnyAux>(expr: Expression<A>): expr is Custom<A> {
    return 'customRelation' in expr
  }

  export function is<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr<A> {
    return isDirect(expr)
      || isIncoming(expr)
      || isOutgoing(expr)
      || isInOut(expr)
  }

  export type OrWhere<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Direct: Direct<A>
    Incoming: Incoming<A>
    Outgoing: Outgoing<A>
    InOut: InOut<A>
    Where: Where<A>
  }>

  export type Any<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Direct: Direct<A>
    Incoming: Incoming<A>
    Outgoing: Outgoing<A>
    InOut: InOut<A>
    Where: Where<A>
    Custom: Custom<A>
  }>

  export function unwrap<A extends AnyAux>(
    expr: RelationExpr.Any<A>,
  ): Direct<A> | Incoming<A> | Outgoing<A> | InOut<A> {
    if (isCustom(expr)) {
      expr = expr.customRelation.expr
    }
    if (isWhere(expr)) {
      expr = expr.where.expr
    }
    return expr
  }
}

export type RelationExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Direct: RelationExpr.Direct<A>
  Incoming: RelationExpr.Incoming<A>
  Outgoing: RelationExpr.Outgoing<A>
  InOut: RelationExpr.InOut<A>
}>

/**
 * Represents a version 2 expression which can be one of several types.
 *
 * @template D - The type for the deployment FQN, defaults to `Fqn`.
 * @template M - The type for the model FQN, defaults to `Fqn`.
 */
export type Expression<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Wildcard: FqnExpr.Wildcard
  ModelRef: FqnExpr.ModelRef<A>
  DeploymentRef: FqnExpr.DeploymentRef<A>
  ElementKind: FqnExpr.ElementKindExpr<A>
  ElementTag: FqnExpr.ElementTagExpr<A>
  Custom: FqnExpr.Custom<A>
  Direct: RelationExpr.Direct<A>
  Incoming: RelationExpr.Incoming<A>
  Outgoing: RelationExpr.Outgoing<A>
  InOut: RelationExpr.InOut<A>
  Where: Expression.Where<A>
  CustomRelation: RelationExpr.Custom<A>
}>

export namespace Expression {
  export type Where<A extends AnyAux = AnyAux> = FqnExpr.Where<A> | RelationExpr.Where<A>
  export function isWhere<A extends AnyAux>(expr: Expression<A>): expr is Expression.Where<A> {
    return 'where' in expr
  }

  export function isRelationWhere<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Where<A> {
    return RelationExpr.isWhere(expr)
  }

  export function isFqnExprWhere<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Where<A> {
    return FqnExpr.isWhere(expr)
  }

  export function isFqnExpr<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Any<A> {
    return FqnExpr.is(expr) || FqnExpr.isWhere(expr) || FqnExpr.isCustom(expr)
  }

  export function isRelation<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Any<A> {
    return RelationExpr.is(expr) || RelationExpr.isWhere(expr) || RelationExpr.isCustom(expr)
  }
}
