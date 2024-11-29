import type { IconUrl } from './_common'
import type { BorderStyle, ElementKind, ElementShape, Fqn, Tag } from './element'
import type { WhereOperator } from './operators'
import type { RelationshipArrowType, RelationshipLineType } from './relation'
import type { Color } from './theme'
import type { ViewId } from './view'

interface BaseExpr {
  where?: never
  element?: never
  custom?: never
  expanded?: never
  elementKind?: never
  elementTag?: never
  isEqual?: never
  isChildren?: never
  isDescendants?: never
  isLeafs?: never
  wildcard?: never
  source?: never
  target?: never
  inout?: never
  incoming?: never
  outgoing?: never
  customRelation?: never
}

export interface ElementRefExpr extends Omit<BaseExpr, 'element' | 'isChildren' | 'isDescendants'> {
  element: Fqn
  isChildren?: boolean
  isDescendants?: boolean
}
export function isElementRef(expr: Expression): expr is ElementRefExpr {
  return 'element' in expr
}

export interface ExpandedElementExpr extends Omit<BaseExpr, 'expanded'> {
  expanded: Fqn
}
export function isExpandedElementExpr(expr: Expression): expr is ExpandedElementExpr {
  return 'expanded' in expr
}

export interface CustomElementExpr extends Omit<BaseExpr, 'custom'> {
  custom: {
    expr: ElementExpression | ElementWhereExpr
    title?: string
    description?: string
    technology?: string
    notation?: string
    shape?: ElementShape
    color?: Color
    icon?: IconUrl
    border?: BorderStyle
    opacity?: number
    navigateTo?: ViewId
  }
}

export function isCustomElement(expr: Expression): expr is CustomElementExpr {
  return 'custom' in expr && (isElement(expr.custom.expr) || isElementWhere(expr.custom.expr))
}

export interface WildcardExpr extends Omit<BaseExpr, 'wildcard'> {
  wildcard: true
}
export function isWildcard(expr: Expression): expr is WildcardExpr {
  return 'wildcard' in expr
}
export interface ElementKindExpr extends Omit<BaseExpr, 'elementKind' | 'isEqual'> {
  elementKind: ElementKind
  isEqual: boolean
}
export function isElementKindExpr(expr: Expression): expr is ElementKindExpr {
  return 'elementKind' in expr && 'isEqual' in expr
}

export interface ElementTagExpr extends Omit<BaseExpr, 'elementTag' | 'isEqual'> {
  elementTag: Tag
  isEqual: boolean
}
export function isElementTagExpr(expr: Expression): expr is ElementTagExpr {
  return 'elementTag' in expr && 'isEqual' in expr
}

export type ElementExpression =
  | ElementRefExpr
  | WildcardExpr
  | ElementKindExpr
  | ElementTagExpr
  | ExpandedElementExpr
export function isElement(expr: Expression): expr is ElementExpression {
  return isElementRef(expr)
    || isWildcard(expr)
    || isElementKindExpr(expr)
    || isElementTagExpr(expr)
    || isExpandedElementExpr(expr)
}

export interface ElementWhereExpr extends Omit<BaseExpr, 'where'> {
  where: {
    expr: ElementExpression
    condition: WhereOperator<string, string>
  }
}
export function isElementWhere(expr: Expression): expr is ElementWhereExpr {
  return 'where' in expr && isElement(expr.where.expr)
}

export type ElementPredicateExpression = ElementExpression | ElementWhereExpr | CustomElementExpr
export function isElementPredicateExpr(expr: Expression): expr is ElementPredicateExpression {
  return isElement(expr) || isElementWhere(expr) || isCustomElement(expr)
}

export interface RelationExpr extends Omit<BaseExpr, 'source' | 'target'> {
  source: ElementExpression
  target: ElementExpression
  isBidirectional?: boolean
}
export function isRelation(expr: Expression): expr is RelationExpr {
  return 'source' in expr && 'target' in expr
}

export interface InOutExpr extends Omit<BaseExpr, 'inout'> {
  inout: ElementExpression
}
export function isInOut(expr: Expression): expr is InOutExpr {
  return 'inout' in expr
}

export interface IncomingExpr extends Omit<BaseExpr, 'incoming'> {
  incoming: ElementExpression
}
export function isIncoming(expr: Expression): expr is IncomingExpr {
  return 'incoming' in expr
}
export interface OutgoingExpr extends Omit<BaseExpr, 'outgoing'> {
  outgoing: ElementExpression
}
export function isOutgoing(expr: Expression): expr is OutgoingExpr {
  return 'outgoing' in expr
}

export type RelationExpression = RelationExpr | InOutExpr | IncomingExpr | OutgoingExpr

export function isRelationExpression(expr: Expression): expr is RelationExpression {
  return isRelation(expr) || isInOut(expr) || isIncoming(expr) || isOutgoing(expr)
}

export interface RelationWhereExpr extends Omit<BaseExpr, 'where'> {
  where: {
    expr: RelationExpression
    condition: WhereOperator<string, string>
  }
}
export function isRelationWhere(expr: Expression): expr is RelationWhereExpr {
  return 'where' in expr && isRelationExpression(expr.where.expr)
}

export interface CustomRelationExpr extends Omit<BaseExpr, 'customRelation'> {
  customRelation: {
    relation: RelationExpression | RelationWhereExpr
    title?: string
    description?: string
    technology?: string
    notation?: string
    // Link to dynamic view
    navigateTo?: ViewId
    // Notes for walkthrough
    notes?: string
    color?: Color
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
  }
}
export function isCustomRelationExpr(expr: Expression): expr is CustomRelationExpr {
  return 'customRelation' in expr
}

export type RelationPredicateExpression = RelationExpression | RelationWhereExpr | CustomRelationExpr

export function isRelationPredicateExpr(expr: Expression): expr is RelationPredicateExpression {
  return isRelationExpression(expr) || isRelationWhere(expr) || isCustomRelationExpr(expr)
}

export type Expression = ElementPredicateExpression | RelationPredicateExpression

// export const Expr = {
//   isElementRef,
//   isWildcard,
//   isElementKindExpr,
//   isElementTagExpr,
//   isElement,
//   isRelation,
//   isInOut,
//   isIncoming,
//   isOutgoing,
//   isAnyRelation,
// }
