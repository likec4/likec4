import type { AnyTypes } from './_types'
import type { Builder } from './Builder'

export interface ProjectBuilder<T extends AnyTypes> extends Builder<T> {
}

export function project<
  A extends AnyTypes,
>(): (input: Builder<A>) => Builder<A>

export function project<
  A extends AnyTypes,
  B extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
): (input: Builder<A>) => Builder<B>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
): (input: Builder<A>) => Builder<C>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
): (input: Builder<A>) => Builder<D>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
): (input: Builder<A>) => Builder<E>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
): (input: Builder<A>) => Builder<F>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
  op6: (input: ProjectBuilder<F>) => ProjectBuilder<G>,
): (input: Builder<A>) => Builder<G>
export function project<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes,
>(
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
  op6: (input: ProjectBuilder<F>) => ProjectBuilder<G>,
  op7: (input: ProjectBuilder<G>) => ProjectBuilder<H>,
): (input: Builder<A>) => Builder<H>
export function project<
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
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
  op6: (input: ProjectBuilder<F>) => ProjectBuilder<G>,
  op7: (input: ProjectBuilder<G>) => ProjectBuilder<H>,
  op8: (input: ProjectBuilder<H>) => ProjectBuilder<I>,
): (input: Builder<A>) => Builder<I>
export function project<
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
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
  op6: (input: ProjectBuilder<F>) => ProjectBuilder<G>,
  op7: (input: ProjectBuilder<G>) => ProjectBuilder<H>,
  op8: (input: ProjectBuilder<H>) => ProjectBuilder<I>,
  op9: (input: ProjectBuilder<I>) => ProjectBuilder<J>,
): (input: Builder<A>) => Builder<J>
export function project<
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
  op1: (input: ProjectBuilder<A>) => ProjectBuilder<B>,
  op2: (input: ProjectBuilder<B>) => ProjectBuilder<C>,
  op3: (input: ProjectBuilder<C>) => ProjectBuilder<D>,
  op4: (input: ProjectBuilder<D>) => ProjectBuilder<E>,
  op5: (input: ProjectBuilder<E>) => ProjectBuilder<F>,
  op6: (input: ProjectBuilder<F>) => ProjectBuilder<G>,
  op7: (input: ProjectBuilder<G>) => ProjectBuilder<H>,
  op8: (input: ProjectBuilder<H>) => ProjectBuilder<I>,
  op9: (input: ProjectBuilder<I>) => ProjectBuilder<J>,
  op10: (input: ProjectBuilder<J>) => ProjectBuilder<K>,
): (input: Builder<A>) => Builder<K>
export function project(...ops: any[]) {
  return (input: Builder<any>) => {
    let builder = input
    for (const op of ops) {
      builder = op(builder)
    }
    return builder
  }
}

export type StringPropertyHelper<T extends AnyTypes> = <
  T extends AnyTypes,
>(
  value: string,
) => (builder: ProjectBuilder<T>) => ProjectBuilder<T>

export type ProjectHelpers<T extends AnyTypes> = {
  project: typeof project
  id: StringPropertyHelper<T>
  name: StringPropertyHelper<T>
  title: StringPropertyHelper<T>
}

export type ProjectBuilderFunction<A extends AnyTypes, B extends AnyTypes> = (
  helpers: ProjectHelpers<A> & {
    _: ProjectHelpers<A>['project']
  },
) =>
  | ((builder: ProjectBuilder<A>) => ProjectBuilder<B>)
  | ((builder: Builder<A>) => Builder<B>)
