import type { AnyTypes } from './_types'
import type { Builder } from './Builder'

export interface BuilderMethods<T extends AnyTypes> {
  with<A extends AnyTypes>(): Builder<A>

  with<
    A extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>
  ): Builder<A>

  with<
    A extends AnyTypes,
    B extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>
  ): Builder<B>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>
  ): Builder<C>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>
  ): Builder<D>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>
  ): Builder<E>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>
  ): Builder<F>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>
  ): Builder<G>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>
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
    I extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>
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
    J extends AnyTypes
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
    op10: (input: Builder<I>) => Builder<J>
  ): Builder<J>

  // /**
  //  * Add model to the builder
  //  */
  // model<
  //   A extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>
  // ): Builder<A>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>
  // ): Builder<B>
  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>
  // ): Builder<C>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>
  // ): Builder<D>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>
  // ): Builder<E>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>
  // ): Builder<F>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>
  // ): Builder<G>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>
  // ): Builder<H>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>
  // ): Builder<I>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>
  // ): Builder<J>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes,
  //   K extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>,
  //   op11: (input: ModelBuilder<J>) => ModelBuilder<K>
  // ): Builder<K>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes,
  //   K extends AnyTypes,
  //   L extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>,
  //   op11: (input: ModelBuilder<J>) => ModelBuilder<K>,
  //   op12: (input: ModelBuilder<K>) => ModelBuilder<L>
  // ): Builder<L>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes,
  //   K extends AnyTypes,
  //   L extends AnyTypes,
  //   M extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>,
  //   op11: (input: ModelBuilder<J>) => ModelBuilder<K>,
  //   op12: (input: ModelBuilder<K>) => ModelBuilder<L>,
  //   op13: (input: ModelBuilder<L>) => ModelBuilder<M>
  // ): Builder<M>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes,
  //   K extends AnyTypes,
  //   L extends AnyTypes,
  //   M extends AnyTypes,
  //   N extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>,
  //   op11: (input: ModelBuilder<J>) => ModelBuilder<K>,
  //   op12: (input: ModelBuilder<K>) => ModelBuilder<L>,
  //   op13: (input: ModelBuilder<L>) => ModelBuilder<M>,
  //   op14: (input: ModelBuilder<M>) => ModelBuilder<N>
  // ): Builder<N>

  // model<
  //   A extends AnyTypes,
  //   B extends AnyTypes,
  //   C extends AnyTypes,
  //   D extends AnyTypes,
  //   E extends AnyTypes,
  //   F extends AnyTypes,
  //   G extends AnyTypes,
  //   H extends AnyTypes,
  //   I extends AnyTypes,
  //   J extends AnyTypes,
  //   K extends AnyTypes,
  //   L extends AnyTypes,
  //   M extends AnyTypes,
  //   N extends AnyTypes,
  //   O extends AnyTypes
  // >(
  //   op1: (input: ModelBuilder<T>) => ModelBuilder<A>,
  //   op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
  //   op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
  //   op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
  //   op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
  //   op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
  //   op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
  //   op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
  //   op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
  //   op10: (input: ModelBuilder<I>) => ModelBuilder<J>,
  //   op11: (input: ModelBuilder<J>) => ModelBuilder<K>,
  //   op12: (input: ModelBuilder<K>) => ModelBuilder<L>,
  //   op13: (input: ModelBuilder<L>) => ModelBuilder<M>,
  //   op14: (input: ModelBuilder<M>) => ModelBuilder<N>,
  //   op15: (input: ModelBuilder<N>) => ModelBuilder<O>
  // ): Builder<O>

  // /**
  //  * Add deployment model to the builder
  //  */
  // deployment<
  //   A extends AnyTypes
  // >(
  //   op1: (input: DeploymentModelBuilder<T>) => DeploymentModelBuilder<A>
  // ): Builder<A>

  // deployment<
  //   A extends AnyTypes,
  //   B extends AnyTypes
  // >(
  //   op1: (input: DeploymentModelBuilder<T>) => DeploymentModelBuilder<A>,
  //   op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>
  // ): Builder<B>
}
