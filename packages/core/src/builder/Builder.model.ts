import type { Element, Fqn, ModelRelation } from '../types'
import type { AnyTypes, AnyTypesNested, Invalid, Types, ValidId } from './_types'
import { Builder } from './Builder'
import type { AddElement } from './Builder.element'

export interface ModelBuilder<T extends AnyTypes> extends Builder<T> {
  __addElement(element: Element): Builder<T>
  __addRelation(relation: Omit<ModelRelation, 'id'>): Builder<T>
  /**
   * Create a fully qualified name from an id (for nested models)
   */
  __fqn(id: string): Fqn
  __addSourcelessRelation(relation: Omit<ModelRelation, 'id' | 'source'>): Builder<T>
}

export function model<
  A extends AnyTypes,
>(): (input: Builder<A>) => Builder<A>

export function model<
  A extends AnyTypes,
  B extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
): (input: Builder<A>) => Builder<B>

export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
): (input: Builder<A>) => Builder<C>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
): (input: Builder<A>) => Builder<D>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
): (input: Builder<A>) => Builder<E>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
): (input: Builder<A>) => Builder<F>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
): (input: Builder<A>) => Builder<G>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
): (input: Builder<A>) => Builder<H>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
  I extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
): (input: Builder<A>) => Builder<I>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
): (input: Builder<A>) => Builder<J>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
): (input: Builder<A>) => Builder<K>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
): (input: Builder<A>) => Builder<L>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
): (input: Builder<A>) => Builder<M>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>,
): (input: Builder<A>) => Builder<N>
export function model<
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
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>,
  op14: (input: ModelBuilder<N>) => ModelBuilder<O>,
): (input: Builder<A>) => Builder<O>
export function model<
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
  P extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>,
  op14: (input: ModelBuilder<N>) => ModelBuilder<O>,
  op15: (input: ModelBuilder<O>) => ModelBuilder<P>,
): (input: Builder<A>) => Builder<P>
export function model<
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
  P extends AnyTypes,
  Q extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>,
  op14: (input: ModelBuilder<N>) => ModelBuilder<O>,
  op15: (input: ModelBuilder<O>) => ModelBuilder<P>,
  op16: (input: ModelBuilder<P>) => ModelBuilder<Q>,
): (input: Builder<A>) => Builder<Q>
export function model<
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
  P extends AnyTypes,
  Q extends AnyTypes,
  R extends AnyTypes,
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>,
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>,
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>,
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>,
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>,
  op14: (input: ModelBuilder<N>) => ModelBuilder<O>,
  op15: (input: ModelBuilder<O>) => ModelBuilder<P>,
  op16: (input: ModelBuilder<P>) => ModelBuilder<Q>,
  op17: (input: ModelBuilder<Q>) => ModelBuilder<R>,
): (input: Builder<A>) => Builder<R>

export function model(...ops: any[]) {
  return (input: Builder<any>) => {
    let builder = input
    for (const op of ops) {
      builder = op(builder)
    }
    return builder
  }
}

export type RelationshipHelper<Props = unknown> = <
  T extends AnyTypes,
  From extends string & T['Fqn'],
  To extends string & T['Fqn'],
>(
  from: From,
  to: To,
  titleOrProps?: string | Props,
) => (builder: ModelBuilder<T>) => ModelBuilder<T>

export type NestedRelationshipHelper<Props = unknown> = <T extends AnyTypesNested, To extends string & T['Fqn']>(
  to: To,
  titleOrProps?: string | Props,
) => (builder: ModelBuilder<T>) => ModelBuilder<T>

type AddElementHelper<T = unknown> = <const Id extends string>(
  id: ValidId<Id>,
  titleOrProps?: string | T,
) => AddElement<Id>

export type AddElementHelpers<T extends AnyTypes> = T extends
  Types<infer Kinds extends string, any, any, any, any, any, any, any> ? {
    [Kind in Kinds]: AddElementHelper<T['NewElementProps']>
  }
  : Invalid<'No Element Kinds'>

export type ModelHelpers<T extends AnyTypes> = AddElementHelpers<T> & {
  model: typeof model
  rel: RelationshipHelper<T['NewRelationshipProps']>
  relTo: NestedRelationshipHelper<T['NewRelationshipProps']>
}

export type ModelBuilderFunction<A extends AnyTypes, B extends AnyTypes> = (
  helpers: ModelHelpers<A> & {
    _: ModelHelpers<A>['model']
  },
  add: ModelHelpers<A>['model'],
) =>
  | ((builder: ModelBuilder<A>) => ModelBuilder<B>)
  | ((builder: Builder<A>) => Builder<B>)
