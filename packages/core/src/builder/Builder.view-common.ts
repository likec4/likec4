import { isArray, isString, map } from 'remeda'
import type { LiteralUnion, Simplify } from 'type-fest'
import {
  type AutoLayoutDirection,
  type CustomElementExpr,
  type CustomRelationExpr,
  type ElementExpression as C4ElementExpression,
  type Expression as C4Expression,
  isElementPredicateExpr,
  type NonEmptyArray,
  type ViewRuleStyle,
  type WhereOperator,
} from '../types'
import type { AnyTypes, Types } from './_types'

export interface LikeC4ViewBuilder<
  Types extends AnyTypes,
  Fqn extends string,
  TypedExpr,
  ElementExpr extends string = ViewPredicate.ElementExpr<Fqn>,
  Expr extends string = ViewPredicate.AllExpression<ElementExpr>,
> {
  Types: Types
  ElementExpr: ElementExpr
  Expr: Expr
  TypedExpr: TypedExpr
  $expr(expr: Expr | TypedExpr): TypedExpr
  include(...exprs: Expr[]): this
  exclude(...exprs: Expr[]): this
  style(rule: ViewRuleStyle): this
  autoLayout(layout: AutoLayoutDirection): this
}

export namespace ViewPredicate {
  export type ElementExpr<Fqn extends string> = '*' | Fqn | `${Fqn}.*` | `${Fqn}._` | `${Fqn}.**`

  export type AllExpression<ElementExpr extends string> =
    | ElementExpr
    | `-> ${ElementExpr} ->`
    | `-> ${ElementExpr}`
    | `${ElementExpr} ->`
    | `${ElementExpr} ${'->' | '<->'} ${ElementExpr}`

  export type Expression<T extends AnyTypes> = T extends
    Types<any, infer F extends string, any, any, any, any, any, any> ? AllExpression<ViewPredicate.ElementExpr<F>>
    : never

  export type ConnectionExpression<T extends AnyTypes> = T extends
    Types<any, infer F extends string, any, any, any, any, any, any> ? `${F} -> ${F}`
    : never

  export type DeploymentExpression<T extends AnyTypes> = T extends
    Types<any, any, any, any, any, any, any, infer F extends string> ? AllExpression<ViewPredicate.ElementExpr<F>>
    : never

  export type DeploymentConnectionExpression<T extends AnyTypes> = T extends
    Types<any, any, any, any, any, any, any, infer F extends string> ? `${F} -> ${F}`
    : never

  export type WhereTag<Tag extends string> = `tag ${'is' | 'is not'} #${Tag}`
  export type WhereKind<Kind extends string> = `kind ${'is' | 'is not'} ${Kind}`

  export type WhereEq<Types extends AnyTypes> =
    | ViewPredicate.WhereTag<Types['Tag']>
    | ViewPredicate.WhereKind<Types['ElementKind']>

  export type WhereOperator<Types extends AnyTypes> = ViewPredicate.WhereEq<Types> | {
    and: NonEmptyArray<ViewPredicate.WhereOperator<Types>>
    or?: never
    not?: never
  } | {
    or: NonEmptyArray<ViewPredicate.WhereOperator<Types>>
    and?: never
    not?: never
  } | {
    not: ViewPredicate.WhereOperator<Types>
    and?: never
    or?: never
  }

  export type Custom<Types extends AnyTypes> = {
    where?: ViewPredicate.WhereOperator<Types>
    with?: Simplify<
      Omit<CustomElementExpr['custom'] & CustomRelationExpr['customRelation'], 'expr' | 'relation' | 'navigateTo'> & {
        navigateTo?: Types['ViewId']
      }
    >
  }
}

function parseWhere(where: ViewPredicate.WhereOperator<AnyTypes>): WhereOperator<any, any> {
  if (isString(where)) {
    const op = where as LiteralUnion<ViewPredicate.WhereEq<AnyTypes>, string>
    switch (true) {
      case op.startsWith('tag is not #'):
        return {
          tag: {
            neq: op.replace('tag is not #', ''),
          },
        }
      case op.startsWith('tag is #'):
        return {
          tag: {
            eq: op.replace('tag is #', ''),
          },
        }
      case op.startsWith('kind is not '):
        return {
          kind: {
            neq: op.replace('kind is not ', ''),
          },
        }
      case op.startsWith('kind is '):
        return {
          kind: {
            eq: op.replace('kind is ', ''),
          },
        }
      default:
        throw new Error(`Unknown where operator: ${where}`)
    }
  }

  if (where.and) {
    return {
      and: map(where.and, parseWhere),
    }
  }
  if (where.or) {
    return {
      or: map(where.or, parseWhere),
    }
  }
  if (where.not) {
    return {
      not: parseWhere(where.not),
    }
  }

  throw new Error(`Unknown where operator: ${where}`)
}

function $include<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  ...args:
    | [B['Expr']]
    | [B['TypedExpr']]
    | [B['Expr'], ViewPredicate.Custom<B['Types']>]
): (b: B) => B {
  return (b) => {
    let expr = b.$expr(args[0])
    if (args.length === 2) {
      const condition = args[1].where ? parseWhere(args[1].where) : undefined
      if (condition) {
        expr = {
          where: {
            expr: expr as any,
            condition,
          },
        }
      }

      const custom = args[1].with
      if (custom) {
        const isElement = isElementPredicateExpr(expr)
        if (isElement) {
          expr = {
            custom: {
              ...custom,
              expr: expr as any,
            },
          }
        } else {
          expr = {
            customRelation: {
              ...custom,
              relation: expr as any,
            },
          }
        }
      }
    }
    b.include(expr as any)
    return b
  }
}

function $exclude<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  ...args:
    | [B['Expr']]
    | [B['TypedExpr']]
    | [B['Expr'], ViewPredicate.Custom<B['Types']>]
): (b: B) => B {
  return (b) => {
    let expr = b.$expr(args[0]) as C4Expression
    if (args.length === 2 && args[1].where) {
      const condition = parseWhere(args[1].where)
      expr = {
        where: {
          expr: expr as any,
          condition,
        },
      }
    }
    b.exclude(expr)
    return b
  }
}

function $style<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  element: B['ElementExpr'] | B['TypedExpr'] | NonEmptyArray<B['ElementExpr']>,
  { notation, ...style }: ViewRuleStyle['style'] & { notation?: string },
): (b: B) => B {
  return (b) =>
    b.style({
      targets: (isArray(element) ? element : [element]).map(e => b.$expr(e as any) as C4ElementExpression),
      ...(notation ? { notation } : {}),
      style: {
        ...style,
      },
    })
}

function $autoLayout<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  layout: AutoLayoutDirection,
): (b: B) => B {
  return (b) => b.autoLayout(layout)
}

type Op<T> = (b: T) => T
function $rules<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(...rules: Op<B>[]): (b: B) => B {
  return (b) => rules.reduce((b, rule) => rule(b), b)
}

export { $autoLayout, $exclude, $include, $rules, $style }
