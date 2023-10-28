import type { ElementKind, Fqn, Tag } from './element'

interface BaseExpr {
  element?: never
  elementKind?: never
  elementTag?: never
  isEqual?: never
  isDescedants?: never
  wildcard?: never
  source?: never
  target?: never
  inout?: never
  incoming?: never
  outgoing?: never
}

export interface ElementRefExpr extends Omit<BaseExpr, 'element' | 'isDescedants'> {
  element: Fqn
  isDescedants?: boolean
}
export function isElementRef(expr: Expression): expr is ElementRefExpr {
  return 'element' in expr
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

export type ElementExpression = ElementRefExpr | WildcardExpr | ElementKindExpr | ElementTagExpr
export function isElement(expr: Expression): expr is ElementExpression {
  return isElementRef(expr) || isWildcard(expr) || isElementKindExpr(expr) || isElementTagExpr(expr)
}

export interface RelationExpr extends Omit<BaseExpr, 'source' | 'target'> {
  source: ElementExpression
  target: ElementExpression
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

export type AnyRelationExpression = RelationExpr | InOutExpr | IncomingExpr | OutgoingExpr

export function isAnyRelation(expr: Expression): expr is AnyRelationExpression {
  return isRelation(expr) || isInOut(expr) || isIncoming(expr) || isOutgoing(expr)
}

export type Expression = ElementExpression | AnyRelationExpression

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
