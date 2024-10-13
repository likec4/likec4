import { isArray, isString, map } from 'remeda'
import type { LiteralUnion, Simplify, Tagged } from 'type-fest'
import {
  type AutoLayoutDirection,
  type CustomElementExpr,
  type CustomRelationExpr,
  type ElementExpression as C4ElementExpression,
  type Expression as C4Expression,
  type Fqn,
  isElementPredicateExpr,
  type NonEmptyArray,
  type ViewRuleStyle,
  type WhereOperator
} from '../types'
import type { AnyTypes, Types } from './_types'
import type { views, ViewsBuilder as Builder } from './Builder.views'

export interface ViewBuilder<T extends AnyTypes> {
  include(...exprs: C4Expression[]): ViewBuilder<T>
  exclude(...exprs: C4Expression[]): ViewBuilder<T>
  style(rule: ViewRuleStyle): ViewBuilder<T>
  autoLayout(layout: AutoLayoutDirection): ViewBuilder<T>
}

export namespace ViewPredicate {
  export type ElementExpr<Fqn extends string> = '*' | Fqn | `${Fqn}.*` | `${Fqn}._`

  type AllExpression<ElementExpr extends string> =
    | ElementExpr
    | `-> ${ElementExpr} ->`
    | `-> ${ElementExpr}`
    | `${ElementExpr} ->`
    | `${ElementExpr} ${'->' | '<->'} ${ElementExpr}`

  export type Expression<T extends AnyTypes> = T extends Types<any, infer F extends string, any, any, any, any>
    ? AllExpression<ViewPredicate.ElementExpr<F>>
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

export type ViewRuleBuilderOp<Types extends AnyTypes> = (b: ViewBuilder<Types>) => ViewBuilder<Types>

export interface AddViewHelper<Props = unknown> {
  // <
  //   const Id extends string,
  //   T extends AnyTypes
  // >(
  //   id: Id
  // ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    builder: (b: ViewBuilder<T>) => ViewBuilder<T>
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: Props | string
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: Props | string | undefined,
    builder: (b: ViewBuilder<T>) => ViewBuilder<T>
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>
}

export interface AddViewOfHelper<Props = unknown> {
  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    builder: (b: ViewBuilder<T>) => ViewBuilder<T>
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    propsOrTitle: Props | string
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    propsOrTitle: Props | string | undefined,
    builder: (b: ViewBuilder<T>) => ViewBuilder<T>
  ): (builder: Builder<T>) => Builder<Types.AddView<T, Id>>
}

// To hook types
type TypedC4Expression<Types extends AnyTypes> = Tagged<C4Expression, 'typed', Types>

function parseWhere(where: ViewPredicate.WhereOperator<AnyTypes>): WhereOperator<any, any> {
  if (isString(where)) {
    const op = where as LiteralUnion<ViewPredicate.WhereEq<AnyTypes>, string>
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

function $include<Types extends AnyTypes>(
  ...args:
    | [ViewPredicate.Expression<Types>]
    | [TypedC4Expression<Types>]
    | [ViewPredicate.Expression<Types>, ViewPredicate.Custom<Types>]
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

function $exclude<Types extends AnyTypes>(
  ...args:
    | [ViewPredicate.Expression<Types>]
    | [TypedC4Expression<Types>]
    | [ViewPredicate.Expression<Types>, ViewPredicate.Custom<Types>]
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

function $expr<Types extends AnyTypes>(expr: ViewPredicate.Expression<Types> | C4Expression): TypedC4Expression<Types> {
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

function $style<Types extends AnyTypes>(
  element: ViewPredicate.ElementExpr<Types['Fqn']> | NonEmptyArray<ViewPredicate.ElementExpr<Types['Fqn']>>,
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

function $autoLayout<Types extends AnyTypes>(
  layout: AutoLayoutDirection
): (b: ViewBuilder<Types>) => ViewBuilder<Types> {
  return (b) => b.autoLayout(layout)
}

function $rules<T extends AnyTypes>(...rules: ViewRuleBuilderOp<T>[]): (b: ViewBuilder<T>) => ViewBuilder<T> {
  return (b) => rules.reduce((b, rule) => rule(b), b)
}

export { $autoLayout, $exclude, $expr, $include, $rules, $style }

export type ViewHelpers<T = unknown> = {
  views: typeof views
  view: AddViewHelper<T>
  viewOf: AddViewOfHelper<T>
  $include: typeof $include
  $exclude: typeof $exclude
  $style: typeof $style
  $rules: typeof $rules
  $autoLayout: typeof $autoLayout
}
