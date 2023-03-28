import type { Fqn } from './element'

export interface ElementRefExpr {
  _expr: 'element'
  element: Fqn
  isDescedants?: true
}

export interface WildcardExpr {
  _expr: 'wildcard'
}


export type ElementExpression = ElementRefExpr | WildcardExpr

export interface BoundRelationExpr {
  _expr: 'rel'
  source: ElementExpression
  target: ElementExpression
}

export interface InOutExpr {
  _expr: 'inout'
  inout: ElementExpression
}

export interface IncomingExpr {
  _expr: 'in'
  target: ElementExpression
}
export interface OutgoingExpr {
  _expr: 'out'
  source: ElementExpression
}

export type RelationExpression =
  BoundRelationExpr |
  InOutExpr |
  IncomingExpr |
  OutgoingExpr

export type Expression = ElementExpression | RelationExpression
