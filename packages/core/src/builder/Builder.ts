import type { ParsedLikeC4Model } from '../types/model'
import type { AnyTypes, AnyTypesNested, Invalid, Types } from './_types'

type ElementBuilders<T extends AnyTypes> = T extends Types<infer Kinds extends string, any, any, any, any, any> ? {
    [Kind in Kinds]: ElementKindBuilder<T['ElementProps']>
  }
  : Invalid<'No Element Kinds'>

export interface Builder<T extends AnyTypes> {
  /**
   * Only available in compile time
   */
  readonly Types: T

  clone(): Builder<T>

  /**
   * Builders for each element kind
   */
  builders(): ElementBuilders<T> & {
    rel: RelationshipBuilder
  }

  buildLikeC4(): ParsedLikeC4Model<
    T['ElementKind'],
    T['RelationshipKind'],
    T['Tag'],
    T['Fqn'],
    T['ViewId']
  >

  model<
    A extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>
  ): Builder<A>

  model<
    A extends AnyTypes,
    B extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>
  ): Builder<B>

  model<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>
  ): Builder<C>

  model<
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

  model<
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

  model<
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

  model<
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

  model<
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

  model<
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

  model<
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

  // model(...ops: ((input: any) => any)[]) {
  //   return ops.reduce((b, op) => op(b), this as Builder<AnyTypes>)
  // }

  ids(): T['Fqn'] // {
  // return null as any
  // }
}

// export class BuilderC<T extends AnyTypes> implements Builder<T> {
//   model(...ops: ((input: any) => any)[]) {
//     return ops.reduce((b, op) => op(b), this as Builder<AnyTypes>)
//   }

//   ids(): T['Fqn'] {
//     throw new Error('Method not implemented.')
//   }
// }

interface AddElement<Id extends string> {
  <T extends AnyTypes>(builder: Builder<T>): Builder<Types.AddFqn<T, Id>>

  with<
    T extends AnyTypes,
    A extends AnyTypesNested
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, A>>

  with<
    T extends AnyTypes,
    A extends AnyTypesNested,
    B extends AnyTypesNested
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, B>>

  with<
    T extends AnyTypes,
    A extends AnyTypesNested,
    B extends AnyTypesNested,
    C extends AnyTypesNested
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, C>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, D>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, E>>

  with<
    T extends AnyTypes,
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes
  >(
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, F>>

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
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, G>>

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
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, H>>

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
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, I>>

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
    op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>,
    op10: (input: Builder<I>) => Builder<J>
  ): (builder: Builder<T>) => Builder<Types.FromNested<T, J>>
}

// interface AddElement<T extends AnyTypes, Id extends string> {
//   (builder: Builder<T>): Builder<Types.AddFqn<T, Id>>

//   nested<
//     A extends AnyTypes
//   >(
//     op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>
//   ): (builder: Builder<T>) => Builder<Types.FromNested<T, A>>

//   nested<
//     A extends AnyTypes,
//     B extends AnyTypes,
//   >(
//     op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
//     op2: (input: Builder<A>) => Builder<B>,
//   ): (builder: Builder<T>) => Builder<Types.FromNested<T, B>>

//   nested<
//     A extends AnyTypes,
//     B extends AnyTypes,
//     C extends AnyTypes
//   >(
//     op1: (input: Builder<Types.ToNested<T, Id>>) => Builder<A>,
//     op2: (input: Builder<A>) => Builder<B>,
//     op3: (input: Builder<B>) => Builder<C>
//   ): (builder: Builder<T>) => Builder<Types.FromNested<T, C>>
// }

// interface AddElement2<T extends AnyTypes, Id extends string> {
//   (builder: Builder<T>): Builder<Types.AddFqn<T, Id>>
// }

// export function element<const Id extends string>(id: Id): AddElement<Id> {
//   return null as any
// }

export interface RelationshipBuilder {
  <T extends AnyTypes, From extends T['RelationshipExpr']>(
    from: From
    // to: T['Fqn']
  ): (builder: Builder<T>) => Builder<T>
}

export type ElementKindBuilder<T = unknown> = <const Id extends string>(
  id: Id,
  titleOrProps?: string | T
) => AddElement<Id>

// // export function element2<const Id extends string, T extends AnyTypes>(id: Id, props: T['ElementProps']): AddElement2<T, Id> {
// //   return null as any
// // }

// // export const element: KindBuilder = null as any
// // export const element2: KindBuilder = null as any

// export function view<const Id extends string>(id: Id): AddElement<Id> {
//   return null as any
// }
