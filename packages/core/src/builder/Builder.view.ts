import { isArray, isString, map } from 'remeda'
import type { LiteralUnion, Simplify, Tagged, Writable } from 'type-fest'
import {
  type AutoLayoutDirection,
  type CustomElementExpr,
  type CustomRelationExpr,
  type DeploymentView,
  type ElementExpression as C4ElementExpression,
  type ElementView,
  type Expression as C4Expression,
  type ExpressionV2,
  type Fqn,
  isElementPredicateExpr,
  type NonEmptyArray,
  type ViewRuleStyle,
  type WhereOperator
} from '../types'
import type { AnyTypes, Types } from './_types'
import type { Builder } from './Builder'
import type { views, ViewsBuilder } from './Builder.views'

interface AViewBuilder<
  Types extends AnyTypes,
  Fqn extends string,
  TypedExpr,
  ElementExpr extends string = ViewPredicate.ElementExpr<Fqn>,
  Expr extends string = ViewPredicate.AllExpression<ElementExpr>
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

export interface ElementViewBuilder<T extends AnyTypes> extends AViewBuilder<T, T['Fqn'], C4Expression> {
}

export interface DeploymentViewBuilder<T extends AnyTypes>
  extends AViewBuilder<T, T['DeploymentFqn'], Types.ToExpression<T>>
{
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

  export type DeploymentExpression<T extends AnyTypes> = T extends
    Types<any, any, any, any, any, any, any, infer F extends string> ? AllExpression<ViewPredicate.ElementExpr<F>>
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

type Op<T> = (b: T) => T
export type ElementViewBuilderOp<Types extends AnyTypes> = (b: ElementViewBuilder<Types>) => ElementViewBuilder<Types>
export type DeploymentViewRuleBuilderOp<Types extends AnyTypes> = (
  b: DeploymentViewBuilder<Types>
) => DeploymentViewBuilder<Types>

/**
 * Chainable builder to create element
 */
export interface AddElementView<Id extends string> {
  <T extends AnyTypes>(builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>

  with<
    T extends AnyTypes
  >(...rules: Op<ElementViewBuilder<T>>[]): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>
}

export interface AddViewHelper<Props = unknown> {
  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>
  ): AddElementView<Id>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: Props | string
  ): AddElementView<Id>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: Props | string | undefined,
    builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>
  ): AddElementView<Id>
}

export interface AddViewOfHelper<Props = unknown> {
  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    propsOrTitle: Props | string
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
    Of extends string & T['Fqn']
  >(
    id: Id,
    of: Of,
    propsOrTitle: Props | string | undefined,
    builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>
}

export interface AddDeploymentViewHelper<Props = unknown> {
  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    builder: DeploymentViewRuleBuilderOp<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: Props | string | undefined,
    builder: DeploymentViewRuleBuilderOp<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>
}

// To hook types
type TypedC4Expression<Types extends AnyTypes> = Tagged<C4Expression, 'typed', Types>
type TypedDeploymentExpression<Types extends AnyTypes> = Tagged<ExpressionV2, 'typed', Types>

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

function $include<B extends AViewBuilder<AnyTypes, any, any>>(
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
            condition
          }
        }
      }

      const custom = args[1].with
      if (custom) {
        const isElement = isElementPredicateExpr(expr)
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
    b.include(expr as any)
    return b
  }
}

function $exclude<B extends AViewBuilder<AnyTypes, any, any>>(
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
          condition
        }
      }
    }
    b.exclude(expr)
    return b
  }
}

const asTypedExpr = <Types extends AnyTypes>(expr: C4Expression): TypedC4Expression<Types> => {
  return expr as TypedC4Expression<Types>
}
function $expr<Types extends AnyTypes>(expr: ViewPredicate.Expression<Types> | C4Expression): TypedC4Expression<Types> {
  if (!isString(expr)) {
    return expr as TypedC4Expression<Types>
  }
  if (expr === '*') {
    return asTypedExpr({ wildcard: true })
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return asTypedExpr({
        inout: $expr(expr.replace(/->/g, '').trim()) as any
      })
    }
    return asTypedExpr({
      incoming: $expr(expr.replace('-> ', '')) as any
    })
  }
  if (expr.endsWith(' ->')) {
    return asTypedExpr({
      outgoing: $expr(expr.replace(' ->', '')) as any
    })
  }
  if (expr.includes(' <-> ')) {
    const [source, target] = expr.split(' <-> ')
    return asTypedExpr({
      source: $expr(source) as any,
      target: $expr(target) as any,
      isBidirectional: true
    })
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return asTypedExpr({
      source: $expr(source) as any,
      target: $expr(target) as any
    })
  }
  if (expr.endsWith('._')) {
    return asTypedExpr({
      expanded: expr.replace('._', '') as Fqn
    })
  }
  if (expr.endsWith('.*')) {
    return asTypedExpr({
      element: expr.replace('.*', '') as Fqn,
      isChildren: true
    })
  }
  if (expr.endsWith('.**')) {
    return asTypedExpr({
      element: expr.replace('.**', '') as Fqn,
      isDescendants: true
    })
  }
  return asTypedExpr({
    element: expr as any as Fqn
  })
}

function $deploymentExpr<T extends AnyTypes>(
  expr: ViewPredicate.DeploymentExpression<T> | ExpressionV2
): Types.ToExpression<T> {
  if (!isString(expr)) {
    return expr as any
  }
  const asTypedDeploymentExpression = (expr: ExpressionV2): Types.ToExpression<T> => {
    return expr as any
  }

  if (expr === '*') {
    return asTypedDeploymentExpression({ wildcard: true })
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return asTypedDeploymentExpression({
        inout: $deploymentExpr(expr.replace(/->/g, '').trim()) as any
      })
    }
    return asTypedDeploymentExpression({
      incoming: $deploymentExpr(expr.replace('-> ', '')) as any
    })
  }
  if (expr.endsWith(' ->')) {
    return asTypedDeploymentExpression({
      outgoing: $deploymentExpr(expr.replace(' ->', '')) as any
    })
  }
  if (expr.includes(' <-> ')) {
    const [source, target] = expr.split(' <-> ')
    return asTypedDeploymentExpression({
      source: $deploymentExpr(source) as any,
      target: $deploymentExpr(target) as any,
      isBidirectional: true
    })
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return asTypedDeploymentExpression({
      source: $deploymentExpr(source) as any,
      target: $deploymentExpr(target) as any
    })
  }
  if (expr.endsWith('._')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('._', '') as Fqn
      },
      selector: 'expanded'
    })
  }
  if (expr.endsWith('.**')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('.**', '') as Fqn
      },
      selector: 'descendants'
    })
  }
  if (expr.endsWith('.*')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('.*', '') as Fqn
      },
      selector: 'children'
    })
  }
  return asTypedDeploymentExpression({
    ref: {
      deployment: expr as any as Fqn
    }
  })
}

function $style<B extends AViewBuilder<AnyTypes, any, any>>(
  element: B['ElementExpr'] | B['TypedExpr'] | NonEmptyArray<B['ElementExpr']>,
  { notation, ...style }: ViewRuleStyle['style'] & { notation?: string }
): (b: B) => B {
  return (b) =>
    b.style({
      targets: (isArray(element) ? element : [element]).map(e => b.$expr(e as any) as C4ElementExpression),
      ...(notation ? { notation } : {}),
      style: {
        ...style
      }
    })
}

function $autoLayout<B extends AViewBuilder<AnyTypes, any, any>>(
  layout: AutoLayoutDirection
): (b: B) => B {
  return (b) => b.autoLayout(layout)
}

function $rules<B extends AViewBuilder<AnyTypes, any, any>>(...rules: Op<B>[]): (b: B) => B {
  return (b) => rules.reduce((b, rule) => rule(b), b)
}

export { $autoLayout, $exclude, $include, $rules, $style }

export type ViewHelpers<T extends AnyTypes> = {
  views: typeof views
  view: AddViewHelper<T['NewViewProps']>
  viewOf: AddViewOfHelper<T['NewViewProps']>
  deploymentView: AddDeploymentViewHelper<T['NewViewProps']>
  $include: typeof $include
  $exclude: typeof $exclude
  $style: typeof $style
  $rules: typeof $rules
  $autoLayout: typeof $autoLayout
}

export type ViewsBuilderFunction<A extends AnyTypes, B extends AnyTypes> = (
  helpers: ViewHelpers<A>,
  add: typeof views
) => (builder: Builder<A>) => Builder<B>

export function mkViewBuilder(view: Writable<DeploymentView>): DeploymentViewBuilder<AnyTypes>
export function mkViewBuilder<T extends AnyTypes>(view: Writable<ElementView>): ElementViewBuilder<T>
export function mkViewBuilder(
  view: Writable<ElementView | DeploymentView>
): DeploymentViewBuilder<AnyTypes> | ElementViewBuilder<AnyTypes> {
  const viewBuilder = {
    $expr: view.__ === 'deployment' ? $deploymentExpr : $expr,
    autoLayout(autoLayout: unknown) {
      view.rules.push({
        direction: autoLayout
      } as any)
      return viewBuilder
    },
    exclude(expr: unknown) {
      view.rules.push({
        exclude: [expr]
      } as any)
      return viewBuilder
    },
    include(expr: unknown) {
      view.rules.push({
        include: [expr]
      } as any)
      return viewBuilder
    },
    style(rule: any) {
      view.rules.push(rule)
      return viewBuilder
    }
    // title(title: string) {
    //   view.title = title
    //   return viewBuilder
    // },
    // description(description: string) {
    //   view.description = description
    //   return viewBuilder
    // }
  }
  return viewBuilder as any
}
