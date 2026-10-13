import z from 'zod'

import type {
  AnyViewRuleStyle,
  FqnExpr,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
  ViewRuleRank,
} from '@likec4/core/types'
import { isNonNullish, keys, pickBy, values } from 'remeda'
import * as common from './common'
import * as schemas from './expression'

// ============ View Expression & Rule Schemas ============

const mapping = {
  'TB': 'TopBottom',
  'BT': 'BottomTop',
  'LR': 'LeftRight',
  'RL': 'RightLeft',
} as const
export interface ZAutoLayoutDirection extends
  z.ZodType<
    (typeof mapping)[keyof typeof mapping],
    keyof typeof mapping | (typeof mapping)[keyof typeof mapping]
  > {}
export const autoLayoutDirection: ZAutoLayoutDirection = z.enum([
  ...keys(mapping),
  ...values(mapping),
]).transform(v => {
  return mapping[v as keyof typeof mapping] ?? v as 'TopBottom' | 'BottomTop' | 'LeftRight' | 'RightLeft'
})

// ---- Element View Rule Schemas ----

export const viewRuleAutoLayout = z
  .object({
    direction: autoLayoutDirection,
    nodeSep: z.number().nullish(),
    rankSep: z.number().nullish(),
  })

export const deploymentViewRuleIncludeAncestors = z
  .strictObject({
    includeAncestors: z.boolean(),
  })

export const viewRuleInclude = z.strictObject({ include: z.array(schemas.expression) })
export const viewRuleExclude = z.strictObject({ exclude: z.array(schemas.expression) })

export interface ZViewRulePredicate extends
  z.ZodType<
    | { include: schemas.ZExpression.Out[]; exclude?: never }
    | { include?: never; exclude: schemas.ZExpression.Out[] },
    | { include: schemas.ZExpression.In[] }
    | { exclude: schemas.ZExpression.In[] }
  > {}

export const viewRulePredicate: ZViewRulePredicate = z
  .xor([
    viewRuleInclude,
    viewRuleExclude,
  ])
// . transform(v => v as ViewRulePredicate)

export const viewRuleStyle = z
  .object({
    targets: z.array(schemas.fqnExpr),
    notation: z.string().optional(),
    style: common.style,
  })
  .transform(v => v as AnyViewRuleStyle<FqnExpr>)

export const viewRuleGlobalStyle = z.object({ styleId: z.string() })
  .transform(v => v as ViewRuleGlobalStyle)
export const viewRuleGlobalPredicate = z.object({ predicateId: z.string() })
  .transform(v => v as ViewRuleGlobalPredicateRef)

const rankValue = z.literal(['max', 'min', 'same', 'sink', 'source'])
export const viewRuleRank = z
  .object({
    targets: z.array(schemas.fqnExpr),
    rank: rankValue,
  })
  .transform(v => v as ViewRuleRank<FqnExpr>)

// Manually typed due to recursive z.lazy schema
export namespace ZViewRuleGroup {
  export type In = {
    groupRules: Array<
      z.input<typeof viewRulePredicate> | z.input<typeof viewRuleGlobalPredicate> | ViewRuleGroupInput
    >
    title: string | null
    color?: z.input<typeof common.color> | null | undefined
    border?: z.input<typeof common.border> | null | undefined
    opacity?: number | undefined | null
    multiple?: boolean | undefined | null
    size?: z.input<typeof common.size> | null | undefined
    padding?: z.input<typeof common.size> | null | undefined
    textSize?: z.input<typeof common.size> | null | undefined
  }

  export type Out = {
    groupRules: Array<
      z.infer<typeof viewRulePredicate> | z.infer<typeof viewRuleGlobalPredicate> | ViewRuleGroupOutput
    >
    title?: string
    color?: z.infer<typeof common.color>
    border?: z.infer<typeof common.border>
    opacity?: number
    multiple?: boolean
    size?: z.infer<typeof common.size>
    padding?: z.infer<typeof common.size>
    textSize?: z.infer<typeof common.size>
  }
}
export type ViewRuleGroupInput = ZViewRuleGroup.In
export type ViewRuleGroupOutput = ZViewRuleGroup.Out
export interface ZViewRuleGroup extends z.ZodType<ZViewRuleGroup.Out, ZViewRuleGroup.In> {}

export const viewRuleGroup: ZViewRuleGroup = z.lazy(() =>
  z.object({
    groupRules: z.array(z.union([viewRulePredicate, viewRuleGlobalPredicate, viewRuleGroup])),
    title: z.string().nullable(),
    color: common.color.optional(),
    border: common.border.optional(),
    opacity: common.opacity.optional(),
    multiple: z.boolean().optional(),
    size: common.size.nullish(),
    padding: common.size.nullish(),
    textSize: common.size.nullish(),
  })
    .transform(pickBy(isNonNullish))
)

export const elementViewRule = z
  .union([
    viewRulePredicate,
    viewRuleAutoLayout,
    viewRuleStyle,
    viewRuleGlobalStyle,
    viewRuleGlobalPredicate,
    viewRuleRank,
    viewRuleGroup,
  ])

const baseViewProps = z.object({
  id: common.viewId,
  title: z.string().nullish().default(null),
  description: common.markdownOrString.nullish().default(null),
  order: z.number().int().nonnegative().optional(),
  tags: common.tags.nullish(),
  links: common.links.nullish(),
})

/** @ts-ignore Cast variance */
export interface ZBaseView<out S extends z.core.$ZodShape> extends
  z.ZodObject<
    S & typeof baseViewProps.shape
  > {
}

function defineView<S extends z.ZodRawShape>(shape: S): ZBaseView<S> {
  return z.object({
    ...baseViewProps.shape,
    ...shape,
  })
}

// ---- Element View Schema ----

/**
 * Replicates ParsedElementView from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const elementView = defineView({
  _type: z.literal('element'),
  viewOf: common.fqn.nullish(),
  extends: common.viewId.nullish(),
  rules: z.array(elementViewRule).optional().default([]),
})
export type ZElementView = typeof elementView

// ---- Deployment View Schema ----

export const deploymentViewRule = z
  .union([
    viewRulePredicate,
    viewRuleAutoLayout,
    viewRuleStyle,
    viewRuleGlobalStyle,
    viewRuleGlobalPredicate,
    deploymentViewRuleIncludeAncestors,
  ])

/**
 * Replicates ParsedElementView from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const deploymentView = defineView({
  _type: z.literal('deployment'),
  rules: z.array(deploymentViewRule).optional().default([]),
})
export type ZDeploymentView = typeof deploymentView

// ---- Dynamic View Schema ----

const _dynamicStep = z
  .object({
    _type: z.never().exactOptional(),
    source: common.fqn,
    target: common.fqn,
    title: z.string().nullish().default(null),
    kind: z.string().nullish(),
    description: common.markdownOrString.nullish(),
    technology: z.string().nullish(),
    notation: z.string().nullish(),
    notes: common.markdownOrString.nullish(),
    color: common.color.optional(),
    line: common.line.optional(),
    head: common.arrow.optional(),
    tail: common.arrow.optional(),
    isBackward: z.boolean().optional(),
    navigateTo: common.viewId.nullish(),
    // __parallel: z.never().optional(),
    // __series: z.never().optional(),
  })
type _DynamicStep = typeof _dynamicStep
export interface ZDynamicStep extends _DynamicStep {}
export const dynamicStep: ZDynamicStep = _dynamicStep

/**
 * @internal to reduce type inference
 */
export interface ZStepInput extends z.input<ZDynamicStep> {
}

/**
 * @internal to reduce type inference
 */
export interface ZStepOutput extends z.output<ZDynamicStep> {
}

type Arr<T, isReadonly extends boolean> = isReadonly extends true ? readonly T[] : T[]

/** @ts-ignore Cast variance */
export type SubflowStep<out S extends {}, isReadonly extends boolean = true> =
  | {
    _type: 'series'
    source?: never
    target?: never
    steps: Arr<S, isReadonly>
  }
  | {
    _type: 'par' | 'parallel' | 'loop' | 'opt' | 'break'
    title?: string | undefined
    source?: never
    target?: never
    steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
  }
  | {
    _type: 'try'
    source?: never
    target?: never
    try: {
      title?: string | undefined
      steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
    }
    catch?: undefined | {
      title?: string | undefined
      steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
    }
    finally?: undefined | {
      title?: string | undefined
      steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
    }
  }
  | {
    _type: 'alt'
    title?: string | undefined
    source?: never
    target?: never
    branches: Arr<{
      _type: 'when' | 'if' | 'else'
      title?: string | undefined
      steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
    }, isReadonly>
  }

export type StepRecursive<S extends {}, isReadonly extends boolean = true> =
  | S
  | SubflowStep<S, isReadonly>

const withSteps = z.object({
  title: z.string().optional(),
  get steps(): z.ZodArray<typeof dynamicViewStep> {
    return z.array(dynamicViewStep).nonempty('must have at least one step')
  },
})
export interface WithSteps<out Out extends {} = {}, out In extends {} = Out> extends
  z.ZodType<
    Out & {
      title?: string | undefined
      steps: StepRecursive<ZStepOutput, false>[]
    },
    In & {
      title?: string | undefined
      steps: StepRecursive<ZStepInput, true>[]
    }
  > {}

export const dynamicStepSeries = z
  .object({
    _type: z.literal('series'),
    steps: z.array(dynamicStep).nonempty('must have at least one step'),
  })

export const dynamicStepBlock = withSteps
  .extend({
    _type: z.enum(['par', 'parallel', 'loop', 'opt', 'break']),
  }) as WithSteps<{ _type: 'par' | 'parallel' | 'loop' | 'opt' | 'break' }>

export const dynamicStepTry = z
  .object({
    _type: z.literal('try'),
    try: withSteps as WithSteps,
    catch: (withSteps as WithSteps).optional(),
    finally: (withSteps as WithSteps).optional(),
  })

export const dynamicStepAltBranch = withSteps
  .extend({
    _type: z.enum(['when', 'if', 'else']),
  }) as WithSteps<{ _type: 'when' | 'if' | 'else' }>

export const dynamicStepAlt = z
  .object({
    _type: z.literal('alt'),
    title: z.string().optional(),
    branches: z.array(dynamicStepAltBranch).nonempty('alt block must have at least one branch'),
  })

export interface ZDynamicViewSubflow extends
  z.ZodType<
    SubflowStep<ZStepOutput, false>,
    SubflowStep<ZStepInput, true>
  > {}

export const dynamicViewSubflow: ZDynamicViewSubflow = z.union([
  dynamicStepAlt,
  dynamicStepSeries,
  dynamicStepBlock,
  dynamicStepTry,
])

export interface ZDynamicViewStep extends
  z.ZodType<
    StepRecursive<ZStepOutput, false>,
    StepRecursive<ZStepInput, true>
  > {}

export const dynamicViewStep: ZDynamicViewStep = z.union([
  dynamicStep,
  dynamicViewSubflow,
])

export const dynamicViewRule = z.union([
  viewRuleInclude,
  viewRuleGlobalPredicate,
  viewRuleStyle,
  viewRuleGlobalStyle,
  viewRuleAutoLayout,
])

export const dynamicViewVariant = z.enum(['diagram', 'sequence'])

/**
 * Replicates ParsedDynamicView from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const dynamicView = defineView({
  _type: z.literal('dynamic'),
  variant: dynamicViewVariant.optional(),
  steps: z.array(dynamicViewStep).optional(),
  rules: z.array(dynamicViewRule).optional(),
})
export type ZDynamicView = typeof dynamicView

export const anyView = z.union([
  elementView,
  deploymentView,
  dynamicView,
])

export const views = z.record(common.viewId, anyView)
