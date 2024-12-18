import type { AnyTypes, Types, TypesNested } from './_types'
import type { DeploymentModelBuilder } from './Builder.deploymentModel'
import type { ModelBuilder } from './Builder.model'

type ToNested<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any, any, infer F>
  ? TypesNested<
    `${P}.${Id}`,
    T['ElementKind'],
    T['Fqn'],
    T['ViewId'],
    T['RelationshipKind'],
    T['Tag'],
    T['MetadataKey'],
    T['DeploymentKind'],
    `${P}.${Id}` | F
  >
  : T extends AnyTypes ? TypesNested<
      Id,
      T['ElementKind'],
      T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      Id | T['DeploymentFqn']
    >
  : never

type FromNested<T extends AnyTypes, N> = N extends TypesNested<any, any, any, any, any, any, any, any, infer F>
  ? T extends TypesNested<infer P, any, any, any, any, any, any, any, any> ? TypesNested<
      P,
      T['ElementKind'],
      T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      F
    >
  : T extends AnyTypes ? Types<
      T['ElementKind'],
      T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      F
    >
  : never
  : never

/**
 * Chainable builder to create deployment node
 */
export interface AddDeploymentNode<Id extends string> {
  <T extends AnyTypes>(builder: DeploymentModelBuilder<T>): DeploymentModelBuilder<Types.AddDeploymentFqn<T, Id>>

  with<T extends AnyTypes>(): (
    builder: DeploymentModelBuilder<T>,
  ) => DeploymentModelBuilder<Types.AddDeploymentFqn<T, Id>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, A>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, B>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, C>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, D>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, E>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
    op6: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, F>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
    op6: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
    op7: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, G>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes,
  >(
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
    op6: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
    op7: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
    op8: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, H>>

  with<
    T extends AnyTypes,
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
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
    op6: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
    op7: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
    op8: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
    op9: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, I>>

  with<
    T extends AnyTypes,
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
    op1: (input: DeploymentModelBuilder<ToNested<T, Id>>) => DeploymentModelBuilder<A>,
    op2: (input: DeploymentModelBuilder<A>) => DeploymentModelBuilder<B>,
    op3: (input: DeploymentModelBuilder<B>) => DeploymentModelBuilder<C>,
    op4: (input: DeploymentModelBuilder<C>) => DeploymentModelBuilder<D>,
    op5: (input: DeploymentModelBuilder<D>) => DeploymentModelBuilder<E>,
    op6: (input: DeploymentModelBuilder<E>) => DeploymentModelBuilder<F>,
    op7: (input: DeploymentModelBuilder<F>) => DeploymentModelBuilder<G>,
    op8: (input: DeploymentModelBuilder<G>) => DeploymentModelBuilder<H>,
    op9: (input: DeploymentModelBuilder<H>) => DeploymentModelBuilder<I>,
    op10: (input: DeploymentModelBuilder<I>) => DeploymentModelBuilder<J>,
  ): (builder: DeploymentModelBuilder<T>) => DeploymentModelBuilder<FromNested<T, J>>
}
