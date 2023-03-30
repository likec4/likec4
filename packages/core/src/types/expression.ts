import type { Fqn } from './element'

interface BaseExr {
  element?: never
  isDescedants?: never
  wildcard?: never
  source?: never
  target?: never
  inout?: never
  incoming?: never
  outgoing?: never
}

export interface ElementRefExpr extends Omit<BaseExr, 'element' | 'isDescedants'> {
  element: Fqn
  isDescedants: boolean
}
export function isElementRef(expr: Expression): expr is ElementRefExpr {
  return 'element' in expr && 'isDescedants' in expr
}

export interface WildcardExpr extends Omit<BaseExr, 'wildcard'> {
  wildcard: true
}
export function isWildcard(expr: Expression): expr is WildcardExpr {
  return 'wildcard' in expr
}


export type ElementExpression = ElementRefExpr | WildcardExpr
export function isElement(expr: Expression): expr is ElementExpression {
  return isElementRef(expr) || isWildcard(expr)
}

export interface RelationExpr extends Omit<BaseExr, 'source' | 'target'> {
  source: ElementExpression
  target: ElementExpression
}
export function isRelation(expr: Expression): expr is RelationExpr {
  return 'source' in expr && 'target' in expr
}

export interface InOutExpr extends Omit<BaseExr, 'inout'> {
  inout: ElementExpression
}
export function isInOut(expr: Expression): expr is InOutExpr {
  return 'inout' in expr
}

export interface IncomingExpr extends Omit<BaseExr, 'incoming'> {
  incoming: ElementExpression
}
export function isIncoming(expr: Expression): expr is IncomingExpr {
  return 'incoming' in expr
}
export interface OutgoingExpr extends Omit<BaseExr, 'outgoing'> {
  outgoing: ElementExpression
}
export function isOutgoing(expr: Expression): expr is OutgoingExpr {
  return 'outgoing' in expr
}

export type AnyRelationExpression =
  RelationExpr |
  InOutExpr |
  IncomingExpr |
  OutgoingExpr

export function isAnyRelation(expr: Expression): expr is AnyRelationExpression {
  return isRelation(expr) || isInOut(expr) || isIncoming(expr) || isOutgoing(expr)
}

export type Expression = ElementExpression | AnyRelationExpression
