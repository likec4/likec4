import { isPlainObject, isString, reduce } from 'remeda'
import type { Expression, NonEmptyArray, Step } from '../types'
import { invariant, isNonEmptyArray } from '../utils'
import type { AnyTypes, Types } from './_types'
import type { LikeC4ViewBuilder, ViewPredicate } from './Builder.view-common'
import type { ViewsBuilder } from './Builder.views'

export interface DynamicViewBuilder<T extends AnyTypes>
  extends LikeC4ViewBuilder<T, T['Fqn'], Expression<Types.ToAux<T>>>
{
}

export type DynamicViewRulesBuilder<T extends AnyTypes> = (b: DynamicViewBuilder<T>) => any

interface AltBranchBuilder<T extends AnyTypes> {
  readonly Types: T
  addBranch(alias: Step.Alt['branches'][number]): this
}

export type AltBranches<T extends AnyTypes> = (b: AltBranchBuilder<T>) => AltBranchBuilder<T>

export interface AddDynamicViewRules<Id extends string> {
  with<S extends AnyTypes>(
    ...rules: Array<
      (b: DynamicViewBuilder<NoInfer<S>>) => any
    >
  ): (builder: ViewsBuilder<S>) => ViewsBuilder<Types.AddView<S, Id>>
}

export interface AddDynamicViewHelper {
  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
  ): AddDynamicViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    builder: DynamicViewRulesBuilder<T>,
  ): {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    propsOrTitle: NoInfer<T>['NewViewProps'] | string,
  ): AddDynamicViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes,
  >(
    id: Id,
    propsOrTitle: NoInfer<T['NewViewProps']> | string | undefined,
    builder: (b: DynamicViewBuilder<T>) => DynamicViewBuilder<T>,
  ): AddDynamicViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }
}

export function $step<
  B extends LikeC4ViewBuilder<AnyTypes, any, any>,
  Fqn extends B['Types']['Fqn'],
  Pair extends `${Fqn} -> ${Fqn}`,
>(
  ...args:
    | [step: NoInfer<Pair>]
    | [
      step: NoInfer<Pair>,
      props: { title?: string } & ViewPredicate.Custom<NoInfer<B>['Types']>,
    ]
    | [source: NoInfer<Fqn>, target: NoInfer<Fqn>]
    | [source: NoInfer<Fqn>, target: NoInfer<Fqn>, props: string]
    | [
      source: NoInfer<Fqn>,
      target: NoInfer<Fqn>,
      props: { title?: string } & ViewPredicate.Custom<NoInfer<B>['Types']>,
    ]
): (b: B) => B {
  let [source, target, propsOrTitle] = args
  if (isString(target)) {
    let props: Partial<Step> | undefined
    if (propsOrTitle != null) {
      props = typeof propsOrTitle === 'string' ? { title: propsOrTitle } : {
        ...propsOrTitle.title && { title: propsOrTitle.title },
        ...propsOrTitle.with,
      }
    }
    return (b: B) =>
      b.step({
        source: source as B['Fqn'],
        target: target as B['Fqn'],
        ...props,
      })
  }

  const [sourceFqn, targetFqn] = (source as string).split(' -> ') as [B['Fqn'], B['Fqn']]
  const props = isPlainObject(target) ?
    {
      ...target.title && { title: target.title },
      ...target.with,
    } :
    {}
  return (b: B) =>
    b.step({
      source: sourceFqn,
      target: targetFqn,
      ...props,
    })
}

function accumulateSteps<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  stepOps: Array<((b: B) => B) | string>,
): NonEmptyArray<Step.Any> {
  const steps: Step.Any[] = []
  const newB = {
    step: (step: Step.Any) => {
      steps.push(step)
      return newB
    },
  } as B
  reduce(stepOps, (acc, step) => {
    if (typeof step === 'function') {
      return step(acc)
    }
    const [sourceFqn, targetFqn] = (step as string).split(' -> ') as [B['Fqn'], B['Fqn']]
    return acc.step({
      source: sourceFqn,
      target: targetFqn,
    })
  }, newB)
  invariant(isNonEmptyArray(steps), 'At least one step is required')
  return steps
}

$step.trycatch = <
  B extends LikeC4ViewBuilder<AnyTypes, any, any>,
  Fqn extends B['Types']['Fqn'],
  Pair extends `${Fqn} -> ${Fqn}`,
>(
  opts: {
    try: Array<
      (
        | ((b: LikeC4ViewBuilder<NoInfer<B>['Types'], any, any>) => any)
        | Pair
      )
    >
    catch?: Array<
      (
        | ((b: LikeC4ViewBuilder<NoInfer<B>['Types'], any, any>) => any)
        | Pair
      )
    >
    finally?: Array<
      (
        | ((b: LikeC4ViewBuilder<NoInfer<B>['Types'], any, any>) => any)
        | Pair
      )
    >
  },
): (b: B) => B => {
  return (b) => {
    const tryBlock = { steps: accumulateSteps(opts.try) }
    const catchBlock = opts.catch ? { catch: { steps: accumulateSteps(opts.catch) } } : undefined
    const finallyBlock = opts.finally ? { finally: { steps: accumulateSteps(opts.finally) } } : undefined
    return b.step({
      _type: 'try',
      try: tryBlock,
      ...catchBlock,
      ...finallyBlock,
    })
  }
}

function makeOperator(type: Step.Any['_type']) {
  return <
    B extends LikeC4ViewBuilder<AnyTypes, any, any>,
    Fqn extends B['Types']['Fqn'],
    Pair extends `${Fqn} -> ${Fqn}`,
  >(
    ...stepOps: Array<
      | ((b: LikeC4ViewBuilder<NoInfer<B>['Types'], any, any>) => any)
      | NoInfer<Pair>
    >
  ): (b: B) => any => {
    return (b) => {
      const steps = accumulateSteps(stepOps)
      return b.step({
        _type: type,
        steps,
      } as any)
    }
  }
}

$step.parallel = makeOperator('par')
$step.loop = makeOperator('loop')
$step.opt = makeOperator('opt')

$step.alt = <B extends LikeC4ViewBuilder<AnyTypes, any, any>>(
  ...stepOps: Array<
    (b: AltBranchBuilder<NoInfer<B>['Types']>) => any
  >
): (b: B) => B => {
  return (b) => {
    const branches = [] as Step.Alt['branches'][number][]
    const branchesB: AltBranchBuilder<B['Types']> = {
      Types: {} as B['Types'],
      addBranch: (branch) => {
        branches.push(branch)
        return branchesB
      },
    }
    stepOps.forEach((step) => {
      step(branchesB)
    })
    invariant(isNonEmptyArray(branches), 'At least one branch is required')
    return b.step({
      _type: 'alt',
      branches,
    })
  }
}

function makeBranchOperator(type: 'when' | 'if' | 'else') {
  return <B extends AltBranchBuilder<AnyTypes>, F extends B['Types']['Fqn'], Pair extends `${F} -> ${F}`>(
    ...stepOps: Array<
      | (
        ((b: LikeC4ViewBuilder<NoInfer<B>['Types'], any, any>) => any)
      )
      | Pair
    >
  ): (b: B) => B => {
    return (b) => {
      const steps = accumulateSteps(stepOps)
      return b.addBranch({
        _type: type,
        steps,
      })
    }
  }
}

$step.when = makeBranchOperator('when')
$step.else = makeBranchOperator('else')
$step.if = makeBranchOperator('if')
