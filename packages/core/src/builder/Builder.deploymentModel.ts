import type { DeployedInstance, DeploymentElement, DeploymentNode, Fqn } from '../types'
import type { AnyTypes, AnyTypesNested, Invalid, Types } from './_types'
import type { Builder } from './Builder'
import type { AddDeploymentNode } from './Builder.deployment'

export interface DeploymentModelBuilder<T extends AnyTypes> {
  addDeployment(node: DeploymentElement): Builder<T>
  /**
   * Create a fully qualified name from an id (for nested models)
   */
  fqn(id: string): Fqn
}

export function deployment<
  A extends AnyTypes,
  B extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>
): (input: Builder<A>) => Builder<B>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>
): (input: Builder<A>) => Builder<C>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>
): (input: Builder<A>) => Builder<D>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>
): (input: Builder<A>) => Builder<E>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>
): (input: Builder<A>) => Builder<F>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>
): (input: Builder<A>) => Builder<G>
export function deployment<
  A extends AnyTypes,
  B extends AnyTypes,
  C extends AnyTypes,
  D extends AnyTypes,
  E extends AnyTypes,
  F extends AnyTypes,
  G extends AnyTypes,
  H extends AnyTypes
>(
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>
): (input: Builder<A>) => Builder<H>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>
): (input: Builder<A>) => Builder<I>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>
): (input: Builder<A>) => Builder<J>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>
): (input: Builder<A>) => Builder<K>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>,
  op11: (input: DeploymentModelBuilder<K>) => DeploymentModelBuilder<L>
): (input: Builder<A>) => Builder<L>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>,
  op11: (input: DeploymentModelBuilder<K>) => DeploymentModelBuilder<L>,
  op12: (input: DeploymentModelBuilder<L>) => DeploymentModelBuilder<M>
): (input: Builder<A>) => Builder<M>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>,
  op11: (input: DeploymentModelBuilder<K>) => DeploymentModelBuilder<L>,
  op12: (input: DeploymentModelBuilder<L>) => DeploymentModelBuilder<M>,
  op13: (input: DeploymentModelBuilder<M>) => DeploymentModelBuilder<N>
): (input: Builder<A>) => Builder<N>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>,
  op11: (input: DeploymentModelBuilder<K>) => DeploymentModelBuilder<L>,
  op12: (input: DeploymentModelBuilder<L>) => DeploymentModelBuilder<M>,
  op13: (input: DeploymentModelBuilder<M>) => DeploymentModelBuilder<N>,
  op14: (input: DeploymentModelBuilder<N>) => DeploymentModelBuilder<O>
): (input: Builder<A>) => Builder<O>
export function deployment<
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
  op1: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  op2: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  op3: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  op4: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  op5: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  op6: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  op7: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  op8: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  op9: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  op10: (input: DeploymentModelBuilder<J>) => DeploymentModelBuilder<K>,
  op11: (input: DeploymentModelBuilder<K>) => DeploymentModelBuilder<L>,
  op12: (input: DeploymentModelBuilder<L>) => DeploymentModelBuilder<M>,
  op13: (input: DeploymentModelBuilder<M>) => DeploymentModelBuilder<N>,
  op14: (input: DeploymentModelBuilder<N>) => DeploymentModelBuilder<O>,
  op15: (input: DeploymentModelBuilder<O>) => DeploymentModelBuilder<P>
): (input: Builder<A>) => Builder<P>

export function deployment(...ops: any[]) {
  return (input: Builder<any>) => {
    let builder = input
    for (const op of ops) {
      builder = op(builder)
    }
    return builder
  }
}

export type AddDeployedInstance = <
  const Id extends string,
  T extends AnyTypes,
  To extends string & T['Fqn']
>(
  id: Id,
  to: To
) => (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<Types.AddDeploymentFqn<T, Id>>

type AddDeploymentNodeHelper<T = unknown> = <const Id extends string>(
  id: Id,
  titleOrProps?: string | T
) => AddDeploymentNode<Id>

export type AddDeploymentNodeHelpers<T extends AnyTypes> = T extends
  Types<any, any, any, any, any, any, infer Kinds extends string, any> ? {
    [Kind in Kinds]: AddDeploymentNodeHelper<T['NewDeploymentNodeProps']>
  }
  : Invalid<'No Deployment Kinds'>

export type DeloymentModelHelpers<T extends AnyTypes> = AddDeploymentNodeHelpers<T> & {
  instanceOf: AddDeployedInstance
  deployment: typeof deployment
}
