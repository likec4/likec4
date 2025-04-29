import type { AnyTypes, Invalid, Types, TypesNested } from './_types'
import type { Builder } from './Builder'
import type { ModelBuilder } from './Builder.model'

export interface ActivityBuilder<T extends AnyTypes> extends Builder<T> {
  __addActivityStep(step: string): Builder<T>
}

type ValidActivityName<T, Name extends string> = T extends
  TypesNested<any, any, any, any, any, any, any, any, any, any> ? (
      Name extends `${string}#${string}` ? Invalid<'Activity name must not contain #'> : Name
    )
  : T extends Types<any, infer F, any, any, any, any, any, any, any> ?
    (Name extends `${F}#` ? Invalid<'Activity name is missing, must be in format <fqn>#<name>'> :
      (Name extends `${F}#${string}` ? Name : Invalid<'Activity name must be in format <fqn>#<name>'>))
  : never

type ValidActivity<T extends AnyTypes, P extends { name: string }> = T extends
  TypesNested<any, any, infer F, any, any, any, any, any, any, any> ? (
      P['name'] extends `${string}#${string}` ? Invalid<'Activity name must not contain #'> : P
    )
  : T extends Types<any, infer F, any, any, any, any, any, any, any> ?
    (P['name'] extends `${F}#` ? Invalid<'Activity name is missing, must be in format <fqn>#<name>'> :
      (P['name'] extends `${F}#${string}` ? P : Invalid<'Activity name must be in format <fqn>#<name>'>))
  : never

export type AddActivityHelper = <
  const P extends {
    name: string
  },
  T extends AnyTypes,
>(params: ValidActivity<T, P>) => (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, P['name']>>

export type AddStepHelper = <const T extends AnyTypes>(
  to: `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`,
) => (input: ActivityBuilder<T>) => ActivityBuilder<T>

/**
 * Chainable builder to create activity
 */
export interface AddActivity<T extends AnyTypes, Name extends string> {
  (builder: ModelBuilder<T>): ModelBuilder<Types.AddActivity<T, Name>>

  with(): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, Name>>

  with<A extends AnyTypes>(
    op1: (input: ActivityBuilder<A>) => ActivityBuilder<A>,
  ): (builder: ModelBuilder<A>) => ModelBuilder<Types.AddActivity<T, Name>>

  with<A extends AnyTypes>(
    op1: (input: ActivityBuilder<A>) => ActivityBuilder<A>,
    op2: (input: ActivityBuilder<A>) => ActivityBuilder<A>,
  ): (builder: ModelBuilder<A>) => ModelBuilder<Types.AddActivity<T, Name>>
}
