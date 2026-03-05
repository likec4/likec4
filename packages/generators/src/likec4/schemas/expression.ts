import * as schemas from 'zod/v4'
import * as common from './common'

const refModel = schemas.strictObject({
  model: common.fqn,
  project: schemas.string().optional(),
})

const refDeployment = schemas.strictObject({
  deployment: common.fqn,
  element: common.fqn.nullish(),
})

export const fqnRef = schemas.union([
  refModel,
  refDeployment,
])

// ============ View Expression & Rule Schemas ============

export const selector = schemas.literal(['children', 'expanded', 'descendants'])

export const autoLayoutDirection = schemas.literal(['TB', 'BT', 'LR', 'RL'])

/**
 * Accepts a value directly (shorthand for equality), or an explicit {eq: value} / {neq: value}.
 * Replicates the EqualOperator from the core.
 */
function equalOp<T extends schemas.ZodType>(schema: T) {
  return schemas.union([
    schema.transform((value) => ({ eq: value })),
    schemas.object({ eq: schema }),
    schemas.object({ neq: schema }),
  ])
}

export const whereTag = schemas.object({ tag: equalOp(common.tag) })
export const whereKind = schemas.object({ kind: equalOp(common.kind) })

export const whereParticipant = schemas.object({
  participant: schemas.literal(['source', 'target']),
  operator: schemas.union([
    whereTag,
    whereKind,
  ]),
})

export const whereAnd = schemas.object({
  get and(): schemas.ZodArray<typeof whereOperator> {
    return schemas.array(whereOperator)
  },
})

export const whereNot = schemas.object({
  get not() {
    return whereOperator
  },
})

export const whereOr = schemas.object({
  get or(): schemas.ZodArray<typeof whereOperator> {
    return schemas.array(whereOperator)
  },
})

export const whereOperator = schemas.union([
  whereTag,
  whereKind,
  whereParticipant,
  whereAnd,
  whereOr,
  whereNot,
])

// ---- ModelFqnExpr base variants ----
export const wildcardExpr = schemas.object({ wildcard: schemas.literal(true) })
export const refExpr = schemas.object({
  ref: fqnRef,
  selector: selector.optional(),
})
export const elementKindExpr = schemas.object({
  elementKind: common.kind,
  isEqual: schemas.boolean(),
})
export const elementTagExpr = schemas.object({
  elementTag: common.tag,
  isEqual: schemas.boolean(),
})

export const fqnExpr = schemas.union([
  wildcardExpr,
  refExpr,
  elementKindExpr,
  elementTagExpr,
])

const fqnExprWhere = schemas.strictObject({
  where: schemas.strictObject({
    expr: fqnExpr,
    condition: whereOperator,
  }),
})

export const fqnExprOrWhere = schemas.union([
  fqnExpr,
  fqnExprWhere,
])

/**
 * Common custom properties that apply to both elements and relations
 */
const commonCustomProperties = schemas.object({
  title: schemas.string(),
  description: common.markdownOrString,
  technology: schemas.string(),
  notation: schemas.string(),
  notes: common.markdownOrString,
  navigateTo: common.viewId,
  color: common.color,
})

const customElementProperties = commonCustomProperties.extend({
  shape: common.shape,
  icon: common.icon,
  iconColor: common.color,
  iconSize: common.size,
  iconPosition: common.iconPosition,
  border: common.border,
  opacity: common.opacity,
  multiple: schemas.boolean(),
  size: common.size,
  padding: common.size,
  textSize: common.size,
}).partial()

const customRelationProperties = commonCustomProperties.extend({
  line: common.line,
  head: common.arrow,
  tail: common.arrow,
}).partial()

export const fqnExprCustom = schemas.strictObject({
  custom: customElementProperties.extend({
    expr: fqnExprOrWhere,
  }),
})

export const fqnExprAny = schemas.union([
  fqnExprOrWhere,
  fqnExprCustom,
])

// ---- ModelRelationExpr base variants ----
export const directRelationExpr = schemas.object({
  source: fqnExpr,
  target: fqnExpr,
  isBidirectional: schemas.boolean().optional(),
})
export const incomingRelationExpr = schemas.object({ incoming: fqnExpr })
export const outgoingRelationExpr = schemas.object({ outgoing: fqnExpr })
export const inoutRelationExpr = schemas.object({ inout: fqnExpr })

export const relationExpr = schemas.union([
  directRelationExpr,
  incomingRelationExpr,
  outgoingRelationExpr,
  inoutRelationExpr,
])

export const relationExprOrWhere = schemas.union([
  relationExpr,
  schemas.strictObject({
    where: schemas.strictObject({
      expr: relationExpr,
      condition: whereOperator,
    }),
  }),
])

export const relationExprCustom = schemas.strictObject({
  customRelation: customRelationProperties.extend({
    expr: relationExprOrWhere,
  }),
})

export const relationExprAny = schemas.union([
  relationExprOrWhere,
  relationExprCustom,
])

// Where expression - wraps either a fqn or relation base expression with a condition
export const whereExpr = schemas.object({
  where: schemas.object({
    expr: schemas.union([
      fqnExpr,
      relationExpr,
    ]),
    condition: whereOperator,
  }),
})

/**
 * Full model expression, union of all fqn and relation expression variants.
 * Replicates ModelExpression from the core.
 */
export const expression = schemas.union([
  fqnExpr,
  fqnExprCustom,
  relationExpr,
  relationExprCustom,
  whereExpr,
])

// export type ModelExpressionInput = z.input<typeof ModelExpressionSchema>
// export type ModelExpressionData = z.infer<typeof ModelExpressionSchema>

// // ---- Expression sub-types for operator use ----

// export type WildcardExprData = z.infer<typeof wildcardExpr>
// export type RefExprData = z.infer<typeof refExpr>
// export type ElementKindExprData = z.infer<typeof elementKindExpr>
// export type ElementTagExprData = z.infer<typeof elementTagExpr>
// export type ModelFqnExprData = z.infer<typeof modelFqnExpr>
// export type ModelFqnExprOrWhereData = z.infer<typeof modelFqnExprOrWhere>
// export type ModelFqnExprCustomData = z.infer<typeof modelFqnExprCustom>
// export type ModelFqnExprAnyData = z.infer<typeof modelFqnExprAny>

// export type DirectExprData = z.infer<typeof modelDirectRelationExpr>
// export type IncomingExprData = z.infer<typeof modelIncomingRelationExpr>
// export type OutgoingExprData = z.infer<typeof modelOutgoingRelationExpr>
// export type InOutExprData = z.infer<typeof modelInoutRelationExpr>
// export type ModelRelationExprData = DirectExprData | IncomingExprData | OutgoingExprData | InOutExprData
// export type ModelRelationExprOrWhereData = z.infer<typeof modelRelationExprOrWhere>
// export type ModelRelationExprCustomData = z.infer<typeof modelRelationExprCustom>
// export type ModelRelationExprAnyData = z.infer<typeof modelRelationExprAny>

// // ---- Element View Rule Schemas ----

// const autoLayoutRule = z.object({
//   direction: autoLayoutDirection,
//   nodeSep: z.number().optional(),
//   rankSep: z.number().optional(),
// })

// const includeRule = z.object({ include: z.array(ModelExpressionSchema) })
// const excludeRule = z.object({ exclude: z.array(ModelExpressionSchema) })

// const viewRuleStyle = z.object({
//   targets: z.array(modelFqnExpr),
//   notation: z.string().optional(),
//   style: StylePropertiesSchema,
// })

// const globalStyleRule = z.object({ styleId: z.string() })
// const globalPredicateRule = z.object({ predicateId: z.string() })

// const rankValue = z.enum(['max', 'min', 'same', 'sink', 'source'])
// const viewRuleRank = z.object({
//   targets: z.array(modelFqnExpr),
//   rank: rankValue,
// })

// // Manually typed due to recursive z.lazy schema
// export type ViewRuleGroupData = {
//   groupRules: Array<z.infer<typeof includeRule> | z.infer<typeof excludeRule> | ViewRuleGroupData>
//   title: string | null
//   color?: z.infer<typeof color> | undefined
//   border?: z.infer<typeof border> | undefined
//   opacity?: number | undefined
//   multiple?: boolean | undefined
//   size?: z.infer<typeof size> | undefined
//   padding?: z.infer<typeof size> | undefined
//   textSize?: z.infer<typeof size> | undefined
// }

// const ViewRuleGroupSchema: z.ZodType<ViewRuleGroupData, any> = z.lazy(() =>
//   z.object({
//     groupRules: z.array(z.union([includeRule, excludeRule, ViewRuleGroupSchema])),
//     title: z.string().nullable(),
//     color: color.optional(),
//     border: border.optional(),
//     opacity: opacity.optional(),
//     multiple: z.boolean().optional(),
//     size: size.optional(),
//     padding: size.optional(),
//     textSize: size.optional(),
//   })
// )

// export const ElementViewRuleSchema = z.union([
//   includeRule,
//   excludeRule,
//   autoLayoutRule,
//   viewRuleStyle,
//   globalStyleRule,
//   globalPredicateRule,
//   viewRuleRank,
//   ViewRuleGroupSchema,
// ])

// export type ElementViewRuleInput = z.input<typeof ElementViewRuleSchema>
// export type ElementViewRuleData = z.infer<typeof ElementViewRuleSchema>

// // ---- Element View Schema ----

// /**
//  * Replicates ParsedElementView from the core,
//  * less strict, as the generator should be able to handle missing fields and provide defaults.
//  */
// export const ElementViewSchema = z
//   .object({
//     id: viewId,
//     title: z.string().nullish(),
//     description: markdownOrString.nullish(),
//     tags: tags.nullish(),
//     links: links.nullish(),
//     viewOf: fqn.nullish(),
//     extends: viewId.nullish(),
//     rules: z.array(ElementViewRuleSchema).default([]),
//   })
//   .transform(v => ({
//     ...pickBy(v, isNonNullish),
//     _stage: 'parsed' as const,
//     _type: 'element' as const,
//     title: v.title ?? null,
//     description: v.description ?? null,
//     rules: v.rules,
//   }))

// export type ElementViewInput = z.input<typeof ElementViewSchema>
// export type ElementViewData = z.infer<typeof ElementViewSchema>

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
//       z.record(viewId, ElementViewSchema),
//       z.array(ElementViewSchema)
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

// // interface BaseLikeC4ModelData<A extends Any> {
// //   [_stage]: A['Stage']
// //   projectId: aux.ProjectId<A>
// //   project: LikeC4Project
// //   specification: Specification<A>
// //   elements: Record<aux.ElementId<A>, Element<A>>
// //   deployments: {
// //     elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
// //     relations: Record<scalar.RelationId, DeploymentRelationship<A>>
// //   }
// //   relations: Record<scalar.RelationId, Relationship<A>>
// //   globals: ModelGlobals
// //   imports: Record<string, NonEmptyArray<Element<A>>>
// // }
