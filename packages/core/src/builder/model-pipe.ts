import type { AnyTypesHook } from './_types'
import type { LikeC4ModelBuilder, WithModelMethods } from './LikeC4ModelBuilder'

export function modelPipe<A extends AnyTypesHook, B extends AnyTypesHook>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>
): LikeC4ModelBuilder<B>
export function modelPipe<A extends AnyTypesHook, B extends AnyTypesHook, C extends AnyTypesHook>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>
): LikeC4ModelBuilder<C>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>
): LikeC4ModelBuilder<D>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>
): LikeC4ModelBuilder<E>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>
): LikeC4ModelBuilder<F>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook,
  G extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
  op6: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>
): LikeC4ModelBuilder<G>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook,
  G extends AnyTypesHook,
  H extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
  op6: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
  op7: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>
): LikeC4ModelBuilder<H>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook,
  G extends AnyTypesHook,
  H extends AnyTypesHook,
  I extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
  op6: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
  op7: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>,
  op8: (input: LikeC4ModelBuilder<H>) => LikeC4ModelBuilder<I>
): LikeC4ModelBuilder<I>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook,
  G extends AnyTypesHook,
  H extends AnyTypesHook,
  I extends AnyTypesHook,
  J extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
  op6: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
  op7: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>,
  op8: (input: LikeC4ModelBuilder<H>) => LikeC4ModelBuilder<I>,
  op9: (input: LikeC4ModelBuilder<I>) => LikeC4ModelBuilder<J>
): LikeC4ModelBuilder<J>
export function modelPipe<
  A extends AnyTypesHook,
  B extends AnyTypesHook,
  C extends AnyTypesHook,
  D extends AnyTypesHook,
  E extends AnyTypesHook,
  F extends AnyTypesHook,
  G extends AnyTypesHook,
  H extends AnyTypesHook,
  I extends AnyTypesHook,
  J extends AnyTypesHook,
  K extends AnyTypesHook
>(
  value: WithModelMethods<A>,
  op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
  op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
  op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
  op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
  op5: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
  op6: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
  op7: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>,
  op8: (input: LikeC4ModelBuilder<H>) => LikeC4ModelBuilder<I>,
  op9: (input: LikeC4ModelBuilder<I>) => LikeC4ModelBuilder<J>,
  op10: (input: LikeC4ModelBuilder<J>) => LikeC4ModelBuilder<K>
): LikeC4ModelBuilder<K>
export function modelPipe(builder: unknown, ...ops: ReadonlyArray<(input: any) => unknown>): any {
  return ops.reduce((b, op) => op(b), builder)
}
