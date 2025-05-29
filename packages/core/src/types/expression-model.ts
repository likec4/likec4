import type { ExclusiveUnion } from './_common'
import type { AnyAux, Aux, UnknownAux } from './aux'
import type { PredicateSelector } from './expression'
import { FqnRef } from './fqnRef'
import type { WhereOperator } from './operators'
import { type Icon } from './scalars'
import type {
  BorderStyle,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  ThemeColor,
} from './styles'

export namespace ModelFqnExpr {
  export type Wildcard = {
    wildcard: true
  }
  export function isWildcard(expr: ModelExpression<any>): expr is ModelFqnExpr.Wildcard {
    return 'wildcard' in expr && expr.wildcard === true
  }

  export interface Ref<M extends AnyAux> {
    ref: FqnRef.ModelRef<M>
    selector?: PredicateSelector
  }
  export function isModelRef<A extends AnyAux>(ref: ModelExpression<A>): ref is ModelFqnExpr.Ref<A> {
    return 'ref' in ref && FqnRef.isModelRef(ref.ref)
  }

  export interface ElementKindExpr<A extends AnyAux = UnknownAux> {
    elementKind: Aux.ElementKind<A>
    isEqual: boolean
  }
  export function isElementKindExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ElementKindExpr<A> {
    return 'elementKind' in expr && 'isEqual' in expr
  }

  export interface ElementTagExpr<A extends AnyAux> {
    elementTag: Aux.Tag<A>
    isEqual: boolean
  }
  export function isElementTagExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ElementTagExpr<A> {
    return 'elementTag' in expr && 'isEqual' in expr
  }

  export type NonWildcard<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
    Ref: Ref<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
  }>

  export interface Where<A extends AnyAux = UnknownAux> {
    where: {
      expr: ExclusiveUnion<{
        Wildcard: Wildcard
        Ref: Ref<A>
        ElementKind: ElementKindExpr<A>
        ElementTag: ElementTagExpr<A>
      }>
      condition: WhereOperator<A>
    }
  }

  export function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Where<A> {
    return 'where' in expr && is(expr.where.expr)
  }

  export interface Custom<A extends AnyAux = UnknownAux> {
    custom: {
      expr: OrWhere<A>
      title?: string
      description?: string
      technology?: string
      notation?: string
      shape?: ElementShape
      color?: ThemeColor
      icon?: Icon
      border?: BorderStyle
      opacity?: number
      navigateTo?: Aux.Strict.ViewId<A>
      multiple?: boolean
      size?: ShapeSize
      padding?: ShapeSize
      textSize?: ShapeSize
    }
  }

  export function isCustom<A extends AnyAux>(expr: ModelExpression<A>): expr is Custom<A> {
    return 'custom' in expr && (is(expr.custom.expr) || isWhere(expr.custom.expr))
  }

  export function is<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr<A> {
    return isWildcard(expr)
      || isModelRef(expr)
      || isElementKindExpr(expr)
      || isElementTagExpr(expr)
  }

  export type OrWhere<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
    Wildcard: ModelFqnExpr.Wildcard
    Ref: ModelFqnExpr.Ref<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
    Where: ModelFqnExpr.Where<A>
  }>

  export type Any<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
    Wildcard: Wildcard
    Ref: Ref<A>
    ElementKind: ElementKindExpr<A>
    ElementTag: ElementTagExpr<A>
    Where: Where<A>
    Custom: Custom<A>
  }>

  export function unwrap<A extends AnyAux>(
    expr: ModelFqnExpr.Any<A>,
  ): Wildcard | Ref<A> | ElementKindExpr<A> | ElementTagExpr<A> {
    if (isCustom(expr)) {
      expr = expr.custom.expr
    }
    if (isWhere(expr)) {
      expr = expr.where.expr
    }
    return expr
  }
}

export type ModelFqnExpr<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
  Wildcard: ModelFqnExpr.Wildcard
  Ref: ModelFqnExpr.Ref<A>
  ElementKind: ModelFqnExpr.ElementKindExpr<A>
  ElementTag: ModelFqnExpr.ElementTagExpr<A>
}>

export namespace ModelRelationExpr {
  export type Endpoint<A extends AnyAux = AnyAux> = ModelFqnExpr.Where<A>['where']['expr']

  export interface Direct<A extends AnyAux = AnyAux> {
    source: Endpoint<A>
    target: Endpoint<A>
    isBidirectional?: boolean
  }
  export function isDirect<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Direct<A> {
    return 'source' in expr && 'target' in expr
  }
  export interface Incoming<A extends AnyAux = AnyAux> {
    incoming: Endpoint<A>
  }
  export function isIncoming<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Incoming<A> {
    return 'incoming' in expr
  }
  export interface Outgoing<A extends AnyAux = AnyAux> {
    outgoing: Endpoint<A>
  }
  export function isOutgoing<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Outgoing<A> {
    return 'outgoing' in expr
  }
  export interface InOut<A extends AnyAux = AnyAux> {
    inout: Endpoint<A>
  }
  export function isInOut<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.InOut<A> {
    return 'inout' in expr
  }
  export interface Where<A extends AnyAux = AnyAux> {
    where: {
      expr: ExclusiveUnion<{
        Direct: ModelRelationExpr.Direct<A>
        Incoming: ModelRelationExpr.Incoming<A>
        Outgoing: ModelRelationExpr.Outgoing<A>
        InOut: ModelRelationExpr.InOut<A>
      }>
      condition: WhereOperator<A>
    }
  }
  export function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Where<A> {
    return 'where' in expr &&
      (isDirect(expr.where.expr) || isIncoming(expr.where.expr) || isOutgoing(expr.where.expr) ||
        isInOut(expr.where.expr))
  }

  export interface Custom<A extends AnyAux = UnknownAux> {
    customRelation: {
      expr: OrWhere<A>
      title?: string
      description?: string
      technology?: string
      notation?: string
      // Link to dynamic view
      navigateTo?: Aux.Strict.ViewId<A>
      // Notes for walkthrough
      notes?: string
      color?: ThemeColor
      line?: RelationshipLineType
      head?: RelationshipArrowType
      tail?: RelationshipArrowType
    }
  }

  export function isCustom<A extends AnyAux>(expr: ModelExpression<A>): expr is Custom<A> {
    return 'customRelation' in expr
  }

  export function is<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr<A> {
    return isDirect(expr)
      || isIncoming(expr)
      || isOutgoing(expr)
      || isInOut(expr)
  }

  export type OrWhere<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
    Direct: Direct<A>
    Incoming: Incoming<A>
    Outgoing: Outgoing<A>
    InOut: InOut<A>
    Where: Where<A>
  }>

  export type Any<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
    Direct: Direct<A>
    Incoming: Incoming<A>
    Outgoing: Outgoing<A>
    InOut: InOut<A>
    Where: Where<A>
    Custom: Custom<A>
  }>

  export function unwrap<A extends AnyAux>(
    expr: ModelRelationExpr.Any<A>,
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

export type ModelRelationExpr<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
  Direct: ModelRelationExpr.Direct<A>
  Incoming: ModelRelationExpr.Incoming<A>
  Outgoing: ModelRelationExpr.Outgoing<A>
  InOut: ModelRelationExpr.InOut<A>
}>

/**
 * Represents a version 2 expression which can be one of several types.
 *
 * @template D - The type for the deployment FQN, defaults to `Fqn`.
 * @template M - The type for the model FQN, defaults to `Fqn`.
 */
export type ModelExpression<A extends AnyAux = UnknownAux> = ExclusiveUnion<{
  Wildcard: ModelFqnExpr.Wildcard
  Ref: ModelFqnExpr.Ref<A>
  ElementKind: ModelFqnExpr.ElementKindExpr<A>
  ElementTag: ModelFqnExpr.ElementTagExpr<A>
  Custom: ModelFqnExpr.Custom<A>
  Direct: ModelRelationExpr.Direct<A>
  Incoming: ModelRelationExpr.Incoming<A>
  Outgoing: ModelRelationExpr.Outgoing<A>
  InOut: ModelRelationExpr.InOut<A>
  Where: ModelExpression.Where<A>
  CustomRelation: ModelRelationExpr.Custom<A>
}>

export namespace ModelExpression {
  export type Where<A extends AnyAux = AnyAux> = ModelFqnExpr.Where<A> | ModelRelationExpr.Where<A>
  export function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelExpression.Where<A> {
    return 'where' in expr
  }

  export function isRelationWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Where<A> {
    return ModelRelationExpr.isWhere(expr)
  }

  export function isFqnExprWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Where<A> {
    return ModelFqnExpr.isWhere(expr)
  }

  export function isFqnExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Any<A> {
    return ModelFqnExpr.is(expr) || ModelFqnExpr.isWhere(expr) || ModelFqnExpr.isCustom(expr)
  }

  export function isRelationExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Any<A> {
    return ModelRelationExpr.is(expr) || ModelRelationExpr.isWhere(expr) || ModelRelationExpr.isCustom(expr)
  }
}
