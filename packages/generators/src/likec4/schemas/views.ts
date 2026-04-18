import * as z from 'zod/v4'

import type {
  AnyViewRuleStyle,
  FqnExpr,
  ViewAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
  ViewRulePredicate,
  ViewRuleRank,
} from '@likec4/core'
import { isNonNullish, pickBy } from 'remeda'
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
  .transform(v => v as ViewAutoLayout)

export const deploymentViewRuleShowAncestors = z
  .strictObject({
    showAncestors: z.boolean(),
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
  _stage: z.literal('parsed').default('parsed'),
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
// .transform(v => ({
//   ...pickBy(v, isNonNullish),
//   title: v.title ?? null,
//   description: v.description ?? null,
//   rules: v.rules,
// }))

// ---- Deployment View Schema ----

export const deploymentViewRule = z
  .union([
    viewRulePredicate,
    viewRuleAutoLayout,
    viewRuleStyle,
    viewRuleGlobalStyle,
    viewRuleGlobalPredicate,
    deploymentViewRuleShowAncestors,
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
// .transform(v => ({
//   ...pickBy(v, isNonNullish),
//   title: v.title ?? null,
//   description: v.description ?? null,
//   rules: v.rules,
// }))

// ---- Dynamic View Schema ----

export const dynamicStep = z
  .object({
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
  .readonly()
  .transform(pickBy(isNonNullish))

export const dynamicStepsSeries = z
  .object({
    // source: z.never().optional(),
    // target: z.never().optional(),
    seriesId: z.string().optional(),
    __series: z.array(z.any()).readonly(),
    // __parallel: z.never().optional(),
    // __series: z.array(dynamicStep).nonempty(),
  })
  .readonly()
  .transform(pickBy(isNonNullish))

export const dynamicStepsParallel = z.object({
  // source: z.never().optional(),
  // target: z.never().optional(),
  // __series: z.never().optional(),
  parallelId: z.string().optional(),
  __parallel: z.array(z.any()).readonly(),
  // __parallel: z.array(z.union([dynamicStep, dynamicStepsSeries])).nonempty(),
})
  .readonly()
  .transform(pickBy(isNonNullish))

export const dynamicViewStep = z.union([
  dynamicStep,
  dynamicStepsSeries,
  dynamicStepsParallel,
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

// export const views = z.union([
//   viewsRecord,
//   z.array(anyView)
// ]).transform(v => {
//   if (Array.isArray(v)) {
//     return indexBy(v, v => v.id) as z.output<typeof viewsRecord>
//   }
//   return v
// })

// export type ElementViewInput = z.input<typeof elementView>
// export type ElementViewData = z.infer<typeof elementView>

// // ============ Top-Level Schema ============

// export const LikeC4DataSchema = z
//   .object({
//     elements: z.union([
//       z.record(fqn, ElementDataSchema),
//       z.array(ElementDataSchema)
//         .transform(indexBy(i => i.id)),
//     ]),
//     relations: z.union([
//       z.record(id, RelationshipSchema),
//       z.array(RelationshipSchema)
//         .transform(
//           indexBy((r, idx) =>
//             r.id as string ?? stringHash(`${r.source.model}, ${r.target.model}, ${r.kind ?? ''}, ${idx}`)
//           ),
//         ),
//     ]),
//     views: z.union([
//       z.record(viewId, elementView),
//       z.array(elementView)
//         .transform(indexBy(v => v.id as string)),
//     ]),
//     project: z.object({
//       id: z.string(),
//       styles: LikeC4StylesConfigSchema.nullish(),
//     }),
//     specification: SpecificationSchema,
//   })
//   .partial()
//   .readonly()
// export type LikeC4DataInput = z.input<typeof LikeC4DataSchema>
// export type LikeC4Data = z.infer<typeof LikeC4DataSchema>

// interface BaseLikeC4ModelData<A extends Any> {
//   [_stage]: A['Stage']
//   projectId: aux.ProjectId<A>
//   project: LikeC4Project
//   specification: Specification<A>
//   elements: Record<aux.ElementId<A>, Element<A>>
//   deployments: {
//     elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
//     relations: Record<scalar.RelationId, DeploymentRelationship<A>>
//   }
//   relations: Record<scalar.RelationId, Relationship<A>>
//   globals: ModelGlobals
//   imports: Record<string, NonEmptyArray<Element<A>>>
// }
