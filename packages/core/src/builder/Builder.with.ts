import type { AnyTypes } from './_types'
import type { Builder } from './Builder'

export interface BuilderMethods<T extends AnyTypes> {
  with<A extends AnyTypes>(): Builder<A>

  with<
    A extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
  ): Builder<A>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
  ): Builder<B>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
  ): Builder<C>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
  ): Builder<D>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
  ): Builder<E>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
  ): Builder<F>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
  ): Builder<G>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes,
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
  ): Builder<H>

  with<
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
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>,
  ): Builder<I>

  with<
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
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>,
    op10: (input: Builder<I>) => Builder<J>,
  ): Builder<J>
}
