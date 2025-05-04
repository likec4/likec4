import { hasAtLeast, isArray, isFunction, isString } from 'remeda'
import { invariant, nonexhaustive } from '../errors'
import { type RelationId, FqnRef } from '../types'
import type { ActivityStep } from '../types/activity'
import { type ActivityId, type Fqn, activityNameFromId, isActivityId } from '../types/scalars'
import { isSameHierarchy } from '../utils/fqn'
import type { AnyTypes, Invalid, Types, TypesNested } from './_types'
import type { ModelBuilder } from './Builder.model'

export interface ActivityBuilder<T extends AnyTypes> {
  /**
   * Add a step to activity
   */
  __addActivityStep(step: Omit<ActivityStep, 'id'>): ActivityBuilder<T>
}

type ValidActivityName<T, Name extends string> = T extends
  TypesNested<any, any, any, any, any, any, any, any, any, any> ? (
      Name extends `${string}#${string}` ? Invalid<`Activity name must not contain #`> : Name
    )
  : T extends Types<any, infer F, any, any, any, any, any, any, any> ?
    (Name extends `${F}#` | `#${string}` ? Invalid<`Activity is missing, must be in format <fqn>#<name>`> :
      (Name extends `${F}#${string}` ? Name : Invalid<`Activity must be in format <fqn>#<name>`>))
  : never

export type ActivityStepExpr<T extends AnyTypes> = `${'->' | '<-'} ${T['Fqn'] | T['Activity']}`

export type StepOrActivityProps<T extends AnyTypes> = {
  title?: string
  description?: string
  technology?: string
  kind?: T['RelationshipKind']
  tags?: T['Tag'] | T['Tags']
}

export type ActivityStepsArray<T extends AnyTypes> = Array<
  | ActivityStepExpr<T>
  | [ActivityStepExpr<T>, string | StepOrActivityProps<T>]
  | ((input: ActivityBuilder<T>) => ActivityBuilder<T>)
>

export type ActivitySteps<T extends AnyTypes> =
  | ActivityStepsArray<T>
  | {
    [key in ActivityStepExpr<T>]?: string | StepOrActivityProps<T>
  }

export type ActivityProps<T extends AnyTypes> = {
  title?: string
  description?: string
  technology?: string
  kind?: T['RelationshipKind']
  tags?: T['Tag'] | T['Tags']
  steps?: ActivityStepsArray<T>
}

export function activity<T extends AnyTypes, Name extends string>(
  name: ValidActivityName<T, Name>,
): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, ValidActivityName<T, Name>>>
export function activity<T extends AnyTypes, const Name extends string>(
  name: ValidActivityName<T, Name>,
  steps: ActivityStepsArray<T>,
): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, ValidActivityName<T, Name>>>
export function activity<T extends AnyTypes, const Name extends string, Props extends ActivityProps<T>>(
  name: ValidActivityName<T, Name>,
  props: Props,
): (builder: ModelBuilder<T>) => ModelBuilder<Types.AddActivity<T, ValidActivityName<T, Name>>>
export function activity(
  ...args:
    | [string]
    | [string, ActivityStepsArray<AnyTypes>]
    | [string, ActivityProps<AnyTypes>]
) {
  return <T extends AnyTypes>(b: ModelBuilder<T>): ModelBuilder<T> => {
    let activityId: ActivityId
    if (isActivityId(args[0])) {
      activityId = args[0]
    } else {
      let parent = b.__fqn('') as string
      parent = parent.substring(0, parent.length - 1)
      activityId = `${parent}#${args[0]}` as ActivityId
    }

    let props: StepOrActivityProps<AnyTypes>
    let steps: ActivityStepsArray<AnyTypes>

    switch (args.length) {
      case 1: {
        props = {}
        steps = []
        break
      }
      case 2: {
        const [, arg2] = args
        if (isArray(arg2)) {
          props = {}
          steps = arg2
          break
        }
        const { steps: _steps = [], ...rest } = arg2
        props = rest
        steps = _steps
        break
      }
      default:
        nonexhaustive(args)
    }
    if (isString(props.tags)) {
      props.tags = [props.tags]
    }

    b.__addActivity({
      name: activityNameFromId(activityId),
      ...props,
      id: activityId,
    })

    if (hasAtLeast(steps, 1)) {
      const activityBuilder: ActivityBuilder<T> = {
        __addActivityStep: (step) => {
          const activity = b.__getActivity(activityId)
          let targetFqn: T['Fqn']
          switch (true) {
            case FqnRef.isActivityRef(step.target): {
              // Ensure target activity exists
              const targetActivity = b.__getActivity(step.target.activity)
              targetFqn = targetActivity.modelRef
              break
            }
            case FqnRef.isModelRef(step.target): {
              targetFqn = step.target.model
              break
            }
            default: {
              nonexhaustive(step.target)
            }
          }
          // Ensure target element exists
          invariant(b.__getElement(targetFqn))
          invariant(
            !isSameHierarchy(activity.modelRef, targetFqn),
            `Invalid activity step between elements in the same hierarchy: "${activityId}", step: "${step}"`,
          )
          activity.steps.push({
            ...step,
            id: `${activityId}_step${activity.steps.length + 1}` as RelationId,
          })
          return activityBuilder
        },
      }
      for (const _step of steps) {
        if (isFunction(_step)) {
          _step(activityBuilder)
          continue
        }
        let expr: ActivityStepExpr<AnyTypes>
        let props: StepOrActivityProps<AnyTypes>
        switch (true) {
          case isString(_step): {
            expr = _step
            props = {}
            break
          }
          case isArray(_step) && hasAtLeast(_step, 2): {
            expr = _step[0]
            props = isString(_step[1]) ? { title: _step[1] } : _step[1]
            break
          }
          case isArray(_step) && hasAtLeast(_step, 1): {
            expr = _step[0]
            props = {}
            break
          }
          default:
            nonexhaustive(_step)
        }
        step(expr, props)(activityBuilder)
      }
    }

    return b
  }
}

export function step<const T extends AnyTypes>(
  to: ActivityStepExpr<T>,
): (builder: ActivityBuilder<T>) => ActivityBuilder<T>
export function step<const T extends AnyTypes>(
  to: ActivityStepExpr<T>,
  title: string,
): (builder: ActivityBuilder<T>) => ActivityBuilder<T>
export function step<const T extends AnyTypes, Props extends StepOrActivityProps<T>>(
  to: ActivityStepExpr<T>,
  props: Props,
): (builder: ActivityBuilder<T>) => ActivityBuilder<T>
export function step(
  ...args: [ActivityStepExpr<AnyTypes>] | [ActivityStepExpr<AnyTypes>, string | StepOrActivityProps<AnyTypes>]
) {
  return <T extends AnyTypes>(b: ActivityBuilder<T>): ActivityBuilder<T> => {
    const expr = args[0]
    let props: StepOrActivityProps<AnyTypes>
    switch (args.length) {
      case 1: {
        props = {}
        break
      }
      case 2: {
        props = isString(args[1]) ? { title: args[1] } : args[1]
        break
      }
      default:
        nonexhaustive(args)
    }

    const isBackward = expr.startsWith('<-')
    const targetExpr = expr.substring(3)
    let target: FqnRef.ActivityRef | FqnRef.ModelRef
    if (isActivityId(targetExpr)) {
      target = {
        activity: targetExpr,
      }
    } else {
      target = {
        model: targetExpr as Fqn,
      }
    }
    if (isString(props.tags)) {
      props.tags = [props.tags]
    }
    b.__addActivityStep({
      ...props,
      isBackward,
      target,
    })
    return b
  }
}
