import type { AnyTypes, Invalid, Types, TypesNested } from './_types'
import type { ModelBuilder } from './Builder.model'

type ToNested<T, Id extends string> = T extends TypesNested<infer P, any, infer F, any, any, any, any> ? TypesNested<
    `${P}.${Id}`,
    T['ElementKind'],
    `${P}.${Id}` | F,
    T['ViewId'],
    T['RelationshipKind'],
    T['Tag'],
    T['MetadataKey']
  >
  : T extends AnyTypes ? TypesNested<
      Id,
      T['ElementKind'],
      Id | T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
  : never

type FromNested<T extends AnyTypes, N> = N extends TypesNested<any, any, infer F, any, any, any, any>
  ? T extends TypesNested<infer P, any, any, any, any, any, any> ? TypesNested<
      P,
      T['ElementKind'],
      F,
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
  : T extends AnyTypes ? Types<
      T['ElementKind'],
      F,
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
  : never
  : never

/**
 * Chainable builder to create element
 */
export interface AddElement<Id extends string> {
  <T extends AnyTypes>(builder: ModelBuilder<T>): ModelBuilder<Types.AddFqn<T, Id>>

  with<
    T extends AnyTypes,
    A extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, A>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, B>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, C>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, D>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, E>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
    op6: (input: ModelBuilder<E>) => ModelBuilder<F>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, F>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
    op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
    op7: (input: ModelBuilder<F>) => ModelBuilder<G>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, G>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
    op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
    op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
    op8: (input: ModelBuilder<G>) => ModelBuilder<H>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, H>>

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
    I extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
    op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
    op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
    op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
    op9: (input: ModelBuilder<H>) => ModelBuilder<I>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, I>>

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
    J extends AnyTypes
  >(
    op1: (input: ModelBuilder<ToNested<T, Id>>) => ModelBuilder<A>,
    op2: (input: ModelBuilder<A>) => ModelBuilder<B>,
    op3: (input: ModelBuilder<B>) => ModelBuilder<C>,
    op4: (input: ModelBuilder<C>) => ModelBuilder<D>,
    op5: (input: ModelBuilder<D>) => ModelBuilder<E>,
    op6: (input: ModelBuilder<E>) => ModelBuilder<F>,
    op7: (input: ModelBuilder<F>) => ModelBuilder<G>,
    op8: (input: ModelBuilder<G>) => ModelBuilder<H>,
    op9: (input: ModelBuilder<H>) => ModelBuilder<I>,
    op10: (input: ModelBuilder<I>) => ModelBuilder<J>
  ): (builder: ModelBuilder<T>) => ModelBuilder<FromNested<T, J>>
}

type AddElementHelper<T = unknown> = <const Id extends string>(
  id: Id,
  titleOrProps?: string | T
) => AddElement<Id>

export type AddElementHelpers<T extends AnyTypes> = T extends Types<infer Kinds extends string, any, any, any, any, any>
  ? {
    [Kind in Kinds]: AddElementHelper<T['NewElementProps']>
  }
  : Invalid<'No Element Kinds'>
