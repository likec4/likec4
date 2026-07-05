import { isString } from 'remeda'
import type { IsLiteral } from 'type-fest'
import type { Expression, Fqn } from '../types'
import type { AnyTypes, Invalid, Types } from './_types'
import type { LikeC4ViewBuilder, ViewPredicate } from './Builder.view-common'
import type { ViewsBuilder } from './Builder.views'

export interface ElementViewBuilder<T extends AnyTypes>
  extends LikeC4ViewBuilder<T, T['Fqn'], Expression<Types.ToAux<T>>>
{
}

export type ElementViewRulesBuilder<T extends AnyTypes> = (b: ElementViewBuilder<T>) => ElementViewBuilder<T>

export interface AddViewRules<Id extends string> {
  with<B extends ViewsBuilder<any>>(
    ...rules: Array<((b: ElementViewBuilder<NoInfer<B>['Types']>) => any)>
  ): (builder: B) => ViewsBuilder<Types.AddView<B['Types'], Id>>
}

export interface AddViewHelper {
  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
  ): AddViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    B extends ViewsBuilder<any>,
  >(
    id: Id,
    builder: (b: ElementViewBuilder<NoInfer<B>['Types']>) => any,
  ): {
    (builder: B): ViewsBuilder<Types.AddView<B['Types'], Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    propsOrTitle: NoInfer<T>['NewViewProps'] | string,
  ): AddViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    B extends ViewsBuilder<any>,
  >(
    id: Id,
    propsOrTitle: NoInfer<B>['Types']['NewViewProps'] | string | undefined,
    builder: (b: ElementViewBuilder<NoInfer<B>['Types']>) => any,
  ): {
    (builder: B): ViewsBuilder<Types.AddView<B['Types'], Id>>
  }
}

type ValidFqn<T extends AnyTypes> = IsLiteral<T['Fqn']> extends true ? T['Fqn']
  : Invalid<'Fqn must be a literal'>

export interface AddViewOfHelper {
  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: NoInfer<T>['Fqn'],
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: NoInfer<T['Fqn']>,
    rules: ElementViewRulesBuilder<NoInfer<T>>,
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: NoInfer<T>['Fqn'],
    propsOrTitle: NoInfer<T>['NewViewProps'] | string,
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: NoInfer<T>['Fqn'],
    propsOrTitle: NoInfer<T>['NewViewProps'] | string,
    rules: ElementViewRulesBuilder<NoInfer<T>>,
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>
}

export interface TypedAddViewOfHelper<A extends AnyTypes> {
  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: ValidFqn<A>,
  ): AddViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: ValidFqn<A>,
    rules: ElementViewRulesBuilder<A>,
  ): {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: ValidFqn<A>,
    propsOrTitle: A['NewViewProps'] | string,
  ): {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    of: ValidFqn<A>,
    propsOrTitle: A['NewViewProps'] | string,
    rules: ElementViewRulesBuilder<A>,
  ): {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }
}
// To hook types
const asTypedExpr = <T extends AnyTypes>(expr: Expression): Expression<Types.ToAux<T>> => {
  return expr as Expression<Types.ToAux<T>>
}

export function $expr<T extends AnyTypes>(
  expr: ViewPredicate.Expression<T> | Expression,
): Expression<Types.ToAux<T>> {
  if (!isString(expr)) {
    return expr as Expression<Types.ToAux<T>>
  }
  if (expr === '*') {
    return asTypedExpr({ wildcard: true })
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return asTypedExpr({
        inout: $expr(expr.replace(/->/g, '').trim()) as any,
      })
    }
    return asTypedExpr({
      incoming: $expr(expr.replace('-> ', '')) as any,
    })
  }
  if (expr.endsWith(' ->')) {
    return asTypedExpr({
      outgoing: $expr(expr.replace(' ->', '')) as any,
    })
  }
  if (expr.includes(' <-> ')) {
    const [source, target] = expr.split(' <-> ')
    return asTypedExpr({
      source: $expr(source) as any,
      target: $expr(target) as any,
      isBidirectional: true,
    })
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return asTypedExpr({
      source: $expr(source) as any,
      target: $expr(target) as any,
    })
  }
  if (expr.endsWith('._')) {
    return asTypedExpr({
      ref: {
        model: expr.replace('._', '') as Fqn,
      },
      selector: 'expanded',
    })
  }
  if (expr.endsWith('.**')) {
    return asTypedExpr({
      ref: {
        model: expr.replace('.**', '') as Fqn,
      },
      selector: 'descendants',
    })
  }
  if (expr.endsWith('.*')) {
    return asTypedExpr({
      ref: {
        model: expr.replace('.*', '') as Fqn,
      },
      selector: 'children',
    })
  }
  return asTypedExpr({
    ref: {
      model: expr as any as Fqn,
    },
  })
}
