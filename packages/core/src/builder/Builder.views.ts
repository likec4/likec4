import type { Simplify, Writable } from 'type-fest'
import type { DeploymentView, ElementView, LikeC4View } from '../types'
import type { AnyTypes } from './_types'
import type { Builder } from './Builder'
import type { $autoLayout, $exclude, $include, $rules, $style } from './Builder.view-common'
import { $deploymentExpr, type AddDeploymentViewHelper, type DeploymentViewBuilder } from './Builder.view-deployment'
import {
  $expr,
  type AddViewHelper,
  type AddViewOfHelper,
  type ElementViewBuilder,
  type TypedAddViewOfHelper
} from './Builder.view-element'

export interface ViewsBuilder<T extends AnyTypes> {
  addView(view: LikeC4View): Builder<T>
}

export function views<A extends AnyTypes>(): (input: Builder<A>) => Builder<A>

export function views<
  A extends AnyTypes,
  B extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>
): (input: Builder<A>) => Builder<B>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>
): (input: Builder<A>) => Builder<C>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>
): (input: Builder<A>) => Builder<D>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>
): (input: Builder<A>) => Builder<E>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>
): (input: Builder<A>) => Builder<F>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>
): (input: Builder<A>) => Builder<G>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>
): (input: Builder<A>) => Builder<H>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>
): (input: Builder<A>) => Builder<I>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>
): (input: Builder<A>) => Builder<J>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>
): (input: Builder<A>) => Builder<K>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes,
  L extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>,
  op11: (input: ViewsBuilder<K>) => ViewsBuilder<L>
): (input: Builder<A>) => Builder<L>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes,
  L extends AnyTypes,
  M extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>,
  op11: (input: ViewsBuilder<K>) => ViewsBuilder<L>,
  op12: (input: ViewsBuilder<L>) => ViewsBuilder<M>
): (input: Builder<A>) => Builder<M>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes,
  L extends AnyTypes,
  M extends AnyTypes,
  N extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>,
  op11: (input: ViewsBuilder<K>) => ViewsBuilder<L>,
  op12: (input: ViewsBuilder<L>) => ViewsBuilder<M>,
  op13: (input: ViewsBuilder<M>) => ViewsBuilder<N>
): (input: Builder<A>) => Builder<N>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes,
  L extends AnyTypes,
  M extends AnyTypes,
  N extends AnyTypes,
  O extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>,
  op11: (input: ViewsBuilder<K>) => ViewsBuilder<L>,
  op12: (input: ViewsBuilder<L>) => ViewsBuilder<M>,
  op13: (input: ViewsBuilder<M>) => ViewsBuilder<N>,
  op14: (input: ViewsBuilder<N>) => ViewsBuilder<O>
): (input: Builder<A>) => Builder<O>
export function views<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
  J extends AnyTypes,
  K extends AnyTypes,
  L extends AnyTypes,
  M extends AnyTypes,
  N extends AnyTypes,
  O extends AnyTypes,
  P extends AnyTypes
>(
  op1: (input: ViewsBuilder<A>) => ViewsBuilder<B>,
  op2: (input: ViewsBuilder<B>) => ViewsBuilder<C>,
  op3: (input: ViewsBuilder<C>) => ViewsBuilder<D>,
  op4: (input: ViewsBuilder<D>) => ViewsBuilder<E>,
  op5: (input: ViewsBuilder<E>) => ViewsBuilder<F>,
  op6: (input: ViewsBuilder<F>) => ViewsBuilder<G>,
  op7: (input: ViewsBuilder<G>) => ViewsBuilder<H>,
  op8: (input: ViewsBuilder<H>) => ViewsBuilder<I>,
  op9: (input: ViewsBuilder<I>) => ViewsBuilder<J>,
  op10: (input: ViewsBuilder<J>) => ViewsBuilder<K>,
  op11: (input: ViewsBuilder<K>) => ViewsBuilder<L>,
  op12: (input: ViewsBuilder<L>) => ViewsBuilder<M>,
  op13: (input: ViewsBuilder<M>) => ViewsBuilder<N>,
  op14: (input: ViewsBuilder<N>) => ViewsBuilder<O>,
  op15: (input: ViewsBuilder<O>) => ViewsBuilder<P>
): (input: Builder<A>) => Builder<P>

export function views(...ops: any[]) {
  return (input: Builder<any>) => {
    let builder = input
    for (const op of ops) {
      builder = op(builder)
    }
    return builder
  }
}
export type ViewsHelpers = {
  views: typeof views
  view: AddViewHelper
  viewOf: AddViewOfHelper
  deploymentView: AddDeploymentViewHelper
  $include: typeof $include
  $exclude: typeof $exclude
  $style: typeof $style
  $rules: typeof $rules
  $autoLayout: typeof $autoLayout
}

export type ViewsBuilderFunction<A extends AnyTypes, B extends AnyTypes> = (
  helpers: Simplify<
    Omit<ViewsHelpers, 'viewOf'> & {
      viewOf: TypedAddViewOfHelper<A>
      _: ViewsHelpers['views']
    }
  >,
  add: ViewsHelpers['views']
) => (builder: Builder<A>) => Builder<B>

export function mkViewBuilder(view: Writable<DeploymentView>): DeploymentViewBuilder<AnyTypes>
export function mkViewBuilder(view: Writable<ElementView>): ElementViewBuilder<AnyTypes>
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
