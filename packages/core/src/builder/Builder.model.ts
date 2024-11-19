import type { Element, Fqn, Relation } from '../types'
import type { AnyTypes, AnyTypesNested } from './_types'
import type { Builder } from './Builder'
import type { AddElementHelpers } from './Builder.element'

export interface ModelBuilder<T extends AnyTypes> {
  addElement(element: Element): Builder<T>
  addRelation(relation: Omit<Relation, 'id'>): Builder<T>
  /**
   * Create a fully qualified name from an id (for nested models)
   */
  fqn(id: string): Fqn
  addSourcelessRelation(relation: Omit<Relation, 'id' | 'source'>): Builder<T>
}

export function model<
  A extends AnyTypes,
  B extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>
): (input: Builder<A>) => Builder<B>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>
): (input: Builder<A>) => Builder<C>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>
): (input: Builder<A>) => Builder<D>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>
): (input: Builder<A>) => Builder<E>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>
): (input: Builder<A>) => Builder<F>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>
): (input: Builder<A>) => Builder<G>
export function model<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>
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
  I extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>
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
  J extends AnyTypes
>(
  op1: (input: ModelBuilder<A>) => ModelBuilder<B>,
  op2: (input: ModelBuilder<B>) => ModelBuilder<C>,
  op3: (input: ModelBuilder<C>) => ModelBuilder<D>,
  op4: (input: ModelBuilder<D>) => ModelBuilder<E>,
  op5: (input: ModelBuilder<E>) => ModelBuilder<F>,
  op6: (input: ModelBuilder<F>) => ModelBuilder<G>,
  op7: (input: ModelBuilder<G>) => ModelBuilder<H>,
  op8: (input: ModelBuilder<H>) => ModelBuilder<I>,
  op9: (input: ModelBuilder<I>) => ModelBuilder<J>
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
  K extends AnyTypes
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
  op10: (input: ModelBuilder<J>) => ModelBuilder<K>
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
  L extends AnyTypes
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
  op11: (input: ModelBuilder<K>) => ModelBuilder<L>
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
  M extends AnyTypes
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
  op12: (input: ModelBuilder<L>) => ModelBuilder<M>
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
  N extends AnyTypes
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
  op13: (input: ModelBuilder<M>) => ModelBuilder<N>
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
  O extends AnyTypes
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
  op14: (input: ModelBuilder<N>) => ModelBuilder<O>
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
  P extends AnyTypes
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
  op15: (input: ModelBuilder<O>) => ModelBuilder<P>
): (input: Builder<A>) => Builder<P>

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
  To extends string & T['Fqn']
>(
  from: From,
  to: To,
  titleOrProps?: string | Props
) => (builder: ModelBuilder<T>) => ModelBuilder<T>

export type NestedRelationshipHelper<Props = unknown> = <T extends AnyTypesNested, To extends string & T['Fqn']>(
  to: To,
  titleOrProps?: string | Props
) => (builder: ModelBuilder<T>) => ModelBuilder<T>

export type ModelHelpers<T extends AnyTypes> = AddElementHelpers<T> & {
  model: typeof model
  rel: RelationshipHelper<T['NewRelationshipProps']>
  relTo: NestedRelationshipHelper<T['NewRelationshipProps']>
}
