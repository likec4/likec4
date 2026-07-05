import type { scalar } from '@likec4/core'
import * as z from 'zod/v4'
import * as common from './common'

export interface ZRefModel extends
  z.ZodType<{
    model: scalar.Fqn
    project?: string | undefined
    deployment?: never
  }, {
    model: string
    project?: string | undefined
  }> {}
export const refModel: ZRefModel = z.strictObject({
  model: common.fqn,
  project: z.string().optional(),
})

export interface ZRefDeployment extends
  z.ZodType<{
    deployment: scalar.Fqn
    element?: scalar.Fqn | undefined | null
    model?: never
  }, {
    deployment: string
    element?: string | undefined | null
  }> {}
export const refDeployment: ZRefDeployment = z.strictObject({
  deployment: common.fqn,
  element: common.fqn.nullish(),
})

export namespace ZFqnRef {
  export type In =
    | {
      model: string
      project?: string | undefined
    }
    | {
      deployment: string
      element?: string | undefined | null
    }
  export type Out =
    | {
      model: scalar.Fqn
      project?: string | undefined
      deployment?: never
    }
    | {
      model?: never
      deployment: scalar.Fqn
      element?: scalar.Fqn | undefined | null
    }
}

export interface ZFqnRef extends z.ZodType<ZFqnRef.Out, ZFqnRef.In> {}
export const fqnRef: ZFqnRef = z.union([
  refModel,
  refDeployment,
])

export const selector = z.literal(['children', 'expanded', 'descendants'])

/**
 * Accepts a value directly (shorthand for equality), or an explicit {eq: value} / {neq: value}.
 * Replicates the EqualOperator from the core.
 */
function equalOp<T extends z.ZodType>(schema: T) {
  return z.union([
    schema.transform((value) => ({ eq: value })),
    z.object({ eq: schema }),
    z.object({ neq: schema }),
  ])
}

export const whereTag = z.object({ tag: equalOp(common.tag) })

export const whereKind = z.object({ kind: equalOp(common.kind) })
export const whereMetadata = z.object({
  metadata: z.object({
    key: z.string(),
    value: equalOp(z.string()).optional(),
  }),
})

const whereTagKindMetadata = z.union([
  whereTag,
  whereKind,
  whereMetadata,
])
namespace ZWhereTagKindMetadata {
  export type In = z.input<typeof whereTagKindMetadata>
  export type Out = z.output<typeof whereTagKindMetadata>
}

export const whereParticipant = z.object({
  participant: z.literal(['source', 'target']),
  operator: whereTagKindMetadata,
})

namespace ZWhereParticipant {
  export type In = z.input<typeof whereParticipant>
  export type Out = z.output<typeof whereParticipant>
}

export const whereAnd = z.object({
  get and(): z.ZodArray<ZWhereOperator> {
    return z.array(whereOperator)
  },
})

export const whereNot = z.object({
  get not(): ZWhereOperator {
    return whereOperator
  },
})

export const whereOr = z.object({
  get or(): z.ZodArray<ZWhereOperator> {
    return z.array(whereOperator)
  },
})

/**
 * @internal reduce type inference
 */
export namespace ZWhereOperator {
  export type In =
    | ZWhereTagKindMetadata.In
    | ZWhereParticipant.In
    | { and: ZWhereOperator.In[] }
    | { or: ZWhereOperator.In[] }
    | { not: ZWhereOperator.In }
  export type Out =
    | ZWhereTagKindMetadata.Out
    | ZWhereParticipant.Out
    | { and: ZWhereOperator.Out[] }
    | { or: ZWhereOperator.Out[] }
    | { not: ZWhereOperator.Out }
}
export interface ZWhereOperator extends z.ZodType<ZWhereOperator.Out, ZWhereOperator.In> {}
export const whereOperator: ZWhereOperator = z.union([
  whereTag,
  whereKind,
  whereMetadata,
  whereParticipant,
  whereAnd,
  whereOr,
  whereNot,
])

// ---- ModelFqnExpr base variants ----
export const wildcardExpr = z.object({ wildcard: z.literal(true) })
export const refExpr = z.object({
  ref: fqnRef,
  selector: selector.optional(),
})
export const elementKindExpr = z.object({
  elementKind: common.kind,
  isEqual: z.boolean(),
})
export const elementTagExpr = z.object({
  elementTag: common.tag,
  isEqual: z.boolean(),
})

export const fqnExpr = z.union([
  wildcardExpr,
  refExpr,
  elementKindExpr,
  elementTagExpr,
])

const fqnExprWhere = z.strictObject({
  where: z.strictObject({
    expr: fqnExpr,
    condition: whereOperator,
  }),
})

export const fqnExprOrWhere = z.union([
  fqnExpr,
  fqnExprWhere,
])

/**
 * Common custom properties that apply to both elements and relations
 */
const commonCustomProperties = z.object({
  title: z.string(),
  description: common.markdownOrString,
  technology: z.string(),
  notation: z.string(),
  notes: common.markdownOrString,
  navigateTo: common.viewId,
  color: common.color,
})

const customElementProperties = z.object({
  ...commonCustomProperties.shape,
  shape: common.shape,
  icon: common.icon,
  iconColor: common.color,
  iconSize: common.size,
  iconPosition: common.iconPosition,
  border: common.border,
  opacity: common.opacity,
  multiple: z.boolean(),
  size: common.size,
  padding: common.size,
  textSize: common.size,
}).partial()

const customRelationProperties = z.object({
  ...commonCustomProperties.shape,
  line: common.line,
  head: common.arrow,
  tail: common.arrow,
}).partial()

export const fqnExprCustom = z.strictObject({
  custom: customElementProperties.extend({
    expr: fqnExprOrWhere,
  }),
})

export const fqnExprAny = z.union([
  fqnExprOrWhere,
  fqnExprCustom,
])

// ---- ModelRelationExpr base variants ----
export const directRelationExpr = z.object({
  source: fqnExpr,
  target: fqnExpr,
  isBidirectional: z.boolean().optional(),
})
export const incomingRelationExpr = z.object({ incoming: fqnExpr })
export const outgoingRelationExpr = z.object({ outgoing: fqnExpr })
export const inoutRelationExpr = z.object({ inout: fqnExpr })

export const relationExpr = z.union([
  directRelationExpr,
  incomingRelationExpr,
  outgoingRelationExpr,
  inoutRelationExpr,
])

export const relationExprOrWhere = z.union([
  relationExpr,
  z.strictObject({
    where: z.strictObject({
      expr: relationExpr,
      condition: whereOperator,
    }),
  }),
])

export const relationExprCustom = z.strictObject({
  customRelation: customRelationProperties.extend({
    expr: relationExprOrWhere,
  }),
})

export const relationExprAny = z.union([
  relationExprOrWhere,
  relationExprCustom,
])

// Where expression - wraps either a fqn or relation base expression with a condition
export const whereExpr = z.object({
  where: z.object({
    expr: z.union([
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
export const expression = z.union([
  fqnExpr,
  fqnExprCustom,
  relationExpr,
  relationExprCustom,
  whereExpr,
])
