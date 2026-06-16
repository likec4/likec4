import * as z from 'zod/v4'

import type {
  AnyViewRuleStyle,
  FqnExpr,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
  ViewRulePredicate,
  ViewRuleRank,
} from '@likec4/core/types'
import * as common from './common'
import * as schemas from './expression'

// ============ View Expression & Rule Schemas ============

export const autoLayoutDirection = z.literal(['TB', 'BT', 'LR', 'RL'])

// ---- Element View Rule Schemas ----

export const viewRuleAutoLayout = z
  .object({
    direction: autoLayoutDirection,
    nodeSep: z.number().optional(),
    rankSep: z.number().optional(),
  })

export const deploymentViewRuleIncludeAncestors = z
  .strictObject({
    includeAncestors: z.boolean(),
  })

export const viewRuleInclude = z.strictObject({ include: z.array(schemas.expression) })
export const viewRuleExclude = z.strictObject({ exclude: z.array(schemas.expression) })

export const viewRulePredicate = z
  .union([
    viewRuleInclude,
    viewRuleExclude,
  ])
  .transform(v => v as ViewRulePredicate)

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
export type ViewRuleGroupInput = {
  groupRules: Array<z.input<typeof viewRulePredicate> | ViewRuleGroupInput>
  title: string | null
  color?: z.input<typeof common.color> | undefined
  border?: z.input<typeof common.border> | undefined
  opacity?: number | undefined
  multiple?: boolean | undefined
  size?: z.input<typeof common.size> | undefined
  padding?: z.input<typeof common.size> | undefined
  textSize?: z.input<typeof common.size> | undefined
}

export type ViewRuleGroupOutput = {
  groupRules: Array<z.infer<typeof viewRulePredicate> | ViewRuleGroupOutput>
  title: string | null
  color?: z.infer<typeof common.color> | undefined
  border?: z.infer<typeof common.border> | undefined
  opacity?: number | undefined
  multiple?: boolean | undefined
  size?: z.infer<typeof common.size> | undefined
  padding?: z.infer<typeof common.size> | undefined
  textSize?: z.infer<typeof common.size> | undefined
}

export const viewRuleGroup: z.ZodType<ViewRuleGroupOutput, ViewRuleGroupInput> = z.lazy(() =>
  z.object({
    groupRules: z.array(z.union([viewRulePredicate, viewRuleGroup])),
    title: z.string().nullable(),
    color: common.color.optional(),
    border: common.border.optional(),
    opacity: common.opacity.optional(),
    multiple: z.boolean().optional(),
    size: common.size.optional(),
    padding: common.size.optional(),
    textSize: common.size.optional(),
  })
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

const viewProps = z.object({
  id: common.viewId,
  title: z.string().nullish(),
  description: common.markdownOrString.nullish(),
  tags: common.tags.nullish(),
  links: common.links.nullish(),
})

// ---- Element View Schema ----

/**
 * Replicates ParsedElementView from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const elementView = viewProps
  .extend({
    _type: z.literal('element'),
    viewOf: common.fqn.nullish(),
    extends: common.viewId.nullish(),
    rules: z.array(elementViewRule).optional().default([]),
  })

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
export const deploymentView = viewProps
  .extend({
    _type: z.literal('deployment'),
    rules: z.array(deploymentViewRule).optional().default([]),
  })

// ---- Dynamic View Schema ----

export const dynamicStep = z
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

/**
 * @internal to reduce type inference
 */
export interface ZStepInput extends z.input<typeof dynamicStep> {
}

/**
 * @internal to reduce type inference
 */
export interface ZStepOutput extends z.output<typeof dynamicStep> {
}

type Arr<T, isReadonly extends boolean> = isReadonly extends true ? readonly T[] : T[]

type StepRecursive<S extends {}, isReadonly extends boolean = false> =
  | S
  | {
    source?: never
    target?: never
  }
    & (
      | {
        _type: 'series'
        steps: Arr<S, isReadonly>
      }
      | {
        _type: 'par' | 'loop' | 'opt'
        title?: string | undefined
        steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
      }
      | {
        _type: 'try'
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
        branches: Arr<{
          _type: 'when' | 'if' | 'else'
          title?: string | undefined
          steps: Arr<StepRecursive<S, isReadonly>, isReadonly>
        }, isReadonly>
      }
    )

const withSteps = z.object({
  title: z.string().optional(),
  source: z.never().exactOptional(),
  target: z.never().exactOptional(),
  get steps(): z.ZodArray<typeof dynamicViewStep> {
    return z.array(dynamicViewStep).nonempty('must have at least one step')
  },
})

export const dynamicStepSeries = z
  .object({
    _type: z.literal('series'),
    steps: z.array(dynamicStep).nonempty('must have at least one step'),
  })
  .readonly()

export const dynamicStepBlock = withSteps
  .extend({
    _type: z.literal(['par', 'loop', 'opt']),
  })
  .readonly()

export const dynamicStepTry = z
  .object({
    _type: z.literal('try'),
    try: withSteps,
    catch: withSteps.optional(),
    finally: withSteps.optional(),
  })
  .readonly()

export const dynamicStepAltBranch = withSteps
  .extend({
    _type: z.literal(['when', 'if', 'else']),
  })
  .readonly()

export const dynamicStepAlt = z
  .object({
    _type: z.literal('alt'),
    title: z.string().optional(),
    branches: z.array(dynamicStepAltBranch).nonempty('alt block must have at least one branch'),
  })
  .readonly()

export interface ZDynamicViewStep extends
  z.ZodType<
    StepRecursive<ZStepOutput>,
    StepRecursive<ZStepInput, true>
  > {}

export const dynamicViewStep: ZDynamicViewStep = z.union([
  dynamicStep,
  dynamicStepAlt,
  dynamicStepSeries,
  dynamicStepBlock,
  dynamicStepTry,
])

export const dynamicViewIncludeRule = z.strictObject({
  include: z.array(schemas.expression),
})

export const dynamicViewRule = z.union([
  dynamicViewIncludeRule,
  viewRuleGlobalPredicate,
  viewRuleStyle,
  viewRuleGlobalStyle,
  viewRuleAutoLayout,
])

export const dynamicViewVariant = z.literal(['diagram', 'sequence'])

/**
 * Replicates ParsedDynamicView from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const dynamicView = viewProps
  .extend({
    _type: z.literal('dynamic'),
    variant: dynamicViewVariant.optional(),
    steps: z.array(dynamicViewStep).optional(),
    rules: z.array(dynamicViewRule).optional(),
  })
// .transform(v => ({
//   ...pickBy(v, isNonNullish),
//   title: v.title ?? null,
//   description: v.description ?? null,
//   steps: v.steps,
//   rules: v.rules,
// }))

export const anyView = z.union([
  elementView,
  deploymentView,
  dynamicView,
])

export const views = z.record(common.viewId, anyView)
