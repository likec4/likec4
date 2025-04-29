import type { IfNever } from 'type-fest'
import type { AnyTypes, Invalid, Types, TypesNested } from './_types'
import type { Builder } from './Builder'
import type { ModelBuilder } from './Builder.model'

export interface ActivityBuilder<T extends AnyTypes> extends Builder<T> {
  __addActivityStep(target: string, props?: StepOrActivityProps<T>): Builder<T>
}

type ValidActivityName<T, Name extends string> = T extends
  TypesNested<any, any, any, any, any, any, any, any, any, any> ? (
      Name extends `${string}#${string}` ? Invalid<'Nested activity must not contain #'> : Name
    )
  : T extends Types<any, infer F, any, any, any, any, any, any, any> ?
    (Name extends `${F}#` ? Invalid<'Activity name is missing, must be in format <fqn>#<name>'> :
      (Name extends `${F}#${string}` ? Name : Invalid<'Activity must be in format <fqn>#<name>'>))
  : never

export type ActivityStepExpr<T extends AnyTypes> = `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`

export type StepOrActivityProps<T extends AnyTypes> = {
  title?: string
  description?: string
  technology?: string
  kind?: T['RelationshipKind']
  tags?: IfNever<T['Tag'], never, [T['Tag'], ...T['Tag'][]]>
}

export type ActivitySteps<T extends AnyTypes> =
  | Array<
    | ActivityStepExpr<T>
    | [ActivityStepExpr<T>]
    | [ActivityStepExpr<T>, title: string]
    | [ActivityStepExpr<T>, StepOrActivityProps<T>]
    | ((input: ActivityBuilder<T>) => ActivityBuilder<T>)
  >
  | {
    [key in ActivityStepExpr<T>]?: string | StepOrActivityProps<T>
  }

export interface AddActivityHelper {
  <const Name extends string, T extends AnyTypes>(
    name: ValidActivityName<T, Name>,
  ): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, Name>>

  <const Name extends string, T extends AnyTypes>(
    name: ValidActivityName<T, Name>,
    steps: ActivitySteps<T>,
  ): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, Name>>

  <const Name extends string, T extends AnyTypes>(
    name: ValidActivityName<T, Name>,
    props: string | StepOrActivityProps<T>,
    steps: ActivitySteps<T>,
  ): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, Name>>
}

export interface AddStepHelper {
  <const T extends AnyTypes>(
    to: `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`,
  ): (input: ActivityBuilder<T>) => ActivityBuilder<T>

  <const T extends AnyTypes>(
    to: `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`,
    title: string,
  ): (input: ActivityBuilder<T>) => ActivityBuilder<T>

  <const T extends AnyTypes>(
    to: `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`,
    props: StepOrActivityProps<T>,
  ): (input: ActivityBuilder<T>) => ActivityBuilder<T>
}
