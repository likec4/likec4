import { isNonNullish, pickBy } from 'remeda'
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
import * as common from './common'
import * as schemas from './expression'

// ============ View Expression & Rule Schemas ============

export const predicateSelector = z.literal(['children', 'expanded', 'descendants'])

export const autoLayoutDirection = z.literal(['TB', 'BT', 'LR', 'RL'])

// ---- Element View Rule Schemas ----

export const viewRuleAutoLayout = z
  .object({
    direction: autoLayoutDirection,
    nodeSep: z.number().optional(),
    rankSep: z.number().optional(),
  })
  .transform(v => v as ViewAutoLayout)

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
    rules: z.array(elementViewRule),
  })
  .transform(v => ({
    ...pickBy(v, isNonNullish),
    title: v.title ?? null,
    description: v.description ?? null,
    rules: v.rules,
  }))

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
