import { isArray, isString, map } from 'remeda'
import type { LiteralUnion, Tagged } from 'type-fest'
import {
  type AutoLayoutDirection,
  type ElementExpression as C4ElementExpression,
  type Expression as C4Expression,
  type Fqn,
  isElementPredicateExpr,
  type NonEmptyArray,
  type ViewRuleStyle,
  type WhereOperator
} from '../types'
import type { AnyTypesHook, TypesHook } from './_types'
import type { ViewBuilder } from './LikeC4ModelBuilder'

// To hook types
type TypedC4Expression<Types extends AnyTypesHook> = Tagged<C4Expression, 'typed', Types>

function parseWhere(where: TypesHook.ViewPredicate.WhereOperator<AnyTypesHook>): WhereOperator<any, any> {
  if (isString(where)) {
    const op = where as LiteralUnion<TypesHook.ViewPredicate.WhereEq<AnyTypesHook>, string>
    switch (true) {
      case op.startsWith('tag is not #'):
        return {
          tag: {
            neq: op.replace('tag is not #', '')
          }
        }
      case op.startsWith('tag is #'):
        return {
          tag: {
            eq: op.replace('tag is #', '')
          }
        }
      case op.startsWith('kind is not '):
        return {
          kind: {
            neq: op.replace('kind is not ', '')
          }
        }
      case op.startsWith('kind is '):
        return {
          kind: {
            eq: op.replace('kind is ', '')
          }
        }
      default:
        throw new Error(`Unknown where operator: ${where}`)
    }
  }

  if (where.and) {
    return {
      and: map(where.and, parseWhere)
    }
  }
  if (where.or) {
    return {
      or: map(where.or, parseWhere)
    }
  }
  if (where.not) {
    return {
      not: parseWhere(where.not)
    }
  }

  throw new Error(`Unknown where operator: ${where}`)
}

function $include<Types extends AnyTypesHook>(
  ...args:
    | [Types['Expression'] | TypedC4Expression<Types>]
    | [Types['Expression'], TypesHook.ViewPredicate.Custom<Types>]
): (b: ViewBuilder<Types>) => ViewBuilder<Types> {
  return (b) => {
    let expr = $expr(args[0]) as C4Expression
    const isElement = isElementPredicateExpr(expr)
    if (args.length === 2) {
      const condition = args[1].where ? parseWhere(args[1].where) : undefined
      if (condition) {
        expr = {
          where: {
            expr: expr as any,
            condition
          }
        }
      }

      const custom = args[1].with
      if (custom) {
        if (isElement) {
          expr = {
            custom: {
              ...custom,
              expr: expr as any
            }
          }
        } else {
          expr = {
            customRelation: {
              ...custom,
              relation: expr as any
            }
          }
        }
      }
    }
    b.include(expr)
    return b
  }
}

function $exclude<Types extends AnyTypesHook>(
  ...args:
    | [Types['Expression'] | TypedC4Expression<Types>]
    | [Types['Expression'], TypesHook.ViewPredicate.Custom<Types>]
): (b: ViewBuilder<Types>) => ViewBuilder<Types> {
  return (b) => {
    let expr = $expr(args[0]) as C4Expression
    if (args.length === 2 && args[1].where) {
      const condition = parseWhere(args[1].where)
      expr = {
        where: {
          expr: expr as any,
          condition
        }
      }
    }
    b.exclude(expr)
    return b
  }
}

function $expr<Types extends AnyTypesHook>(expr: Types['Expression'] | C4Expression): TypedC4Expression<Types> {
  if (!isString(expr)) {
    return expr as TypedC4Expression<Types>
  }
  if (expr === '*') {
    return { wildcard: true } as TypedC4Expression<Types>
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return {
        inout: $expr(expr.replace(/->/g, '').trim()) as any
      } as TypedC4Expression<Types>
    }
    return {
      incoming: $expr(expr.replace('-> ', '')) as any
    } as TypedC4Expression<Types>
  }
  if (expr.endsWith(' ->')) {
    return {
      outgoing: $expr(expr.replace(' ->', '')) as any
    } as TypedC4Expression<Types>
  }
  if (expr.includes(' <-> ')) {
    const [source, target] = expr.split(' <-> ')
    return {
      source: $expr(source) as any,
      target: $expr(target) as any,
      isBidirectional: true
    } as TypedC4Expression<Types>
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return {
      source: $expr(source) as any,
      target: $expr(target) as any
    } as TypedC4Expression<Types>
  }
  if (expr.endsWith('._')) {
    return {
      expanded: expr.replace('._', '') as Fqn
    } as TypedC4Expression<Types>
  }
  if (expr.endsWith('.*')) {
    return {
      element: expr.replace('.*', '') as Fqn,
      isDescedants: true
    } as TypedC4Expression<Types>
  }
  return {
    element: expr as any as Fqn,
    isDescedants: false
  } as TypedC4Expression<Types>
}

function $style<Types extends AnyTypesHook>(
  element: TypesHook.ElementExpr<Types['Fqn']> | NonEmptyArray<TypesHook.ElementExpr<Types['Fqn']>>,
  { notation, ...style }: ViewRuleStyle['style'] & { notation?: string }
): (b: ViewBuilder<Types>) => ViewBuilder<Types> {
  return (b) =>
    b.style({
      targets: (isArray(element) ? element : [element]).map(e => $expr(e) as C4ElementExpression),
      ...notation ? { notation } : {},
      style: {
        ...style
      }
    })
}

function $autoLayout<Types extends AnyTypesHook>(
  layout: AutoLayoutDirection
): (b: ViewBuilder<Types>) => ViewBuilder<Types> {
  return (b) => b.autoLayout(layout)
}

type Builder<Types extends AnyTypesHook> = (b: ViewBuilder<Types>) => ViewBuilder<Types>
function $rules<Types extends AnyTypesHook>(...rules: Builder<Types>[]): Builder<Types> {
  return (b) => rules.reduce((b, rule) => rule(b), b)
}

export { $autoLayout, $exclude, $expr, $include, $rules, $style }
