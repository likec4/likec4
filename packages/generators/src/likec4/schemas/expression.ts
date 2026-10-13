import type { scalar } from '@likec4/core'
import { isDefined, isNonNullish, pickBy } from 'remeda'
import type { Simplify } from 'type-fest'
import * as z from 'zod/v4'
import * as common from './common'

export interface ZRefModel extends
  z.ZodType<{
    readonly model: scalar.Fqn
    readonly project?: string | undefined
    readonly deployment?: never
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
    readonly deployment: scalar.Fqn
    readonly element?: scalar.Fqn | undefined | null
    readonly model?: never
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
      readonly model: scalar.Fqn
      readonly project?: string | undefined
      readonly deployment?: never
      readonly element?: never
    }
    | {
      readonly model?: never
      readonly deployment: scalar.Fqn
      readonly element?: scalar.Fqn | undefined | null
    }
}

export interface ZFqnRef extends z.ZodType<ZFqnRef.Out, ZFqnRef.In> {}
export const fqnRef: ZFqnRef = z.union([
  refModel,
  refDeployment,
])

export const selector = z.enum(['children', 'expanded', 'descendants', '*', '_', '**']).transform((v) => {
  switch (v) {
    case '*':
      return 'children'
    case '_':
      return 'expanded'
    case '**':
      return 'descendants'
    default:
      return v
  }
})

/**
 * Accepts a value directly (shorthand for equality), or an explicit {eq: value} / {neq: value}.
 * Replicates the EqualOperator from the core.
 */
interface ZEqualOp<out Output = unknown, out Input = unknown> extends
  z.ZodType<
    // output
    | { eq: Output }
    | { neq: Output },
    // input
    | Input
    | { eq: Input }
    | { neq: Input }
  > {}
function equalOp<Output, Input>(schema: z.ZodType<Output, Input>): ZEqualOp<Output, Input> {
  return z.xor([
    z.object({ eq: schema }),
    z.object({ neq: schema }),
    schema.transform((value) => ({ eq: value })),
  ])
}

export const whereTag = z.strictObject({ tag: equalOp(common.tag) })

export const whereKind = z.strictObject({ kind: equalOp(common.kind) })
export const whereMetadata = z.strictObject({
  metadata: z.strictObject({
    key: z.string(),
    value: equalOp(z.string()).optional(),
  }),
})

export interface ZWhereTagKindMetadata extends
  z.ZodType<
    | z.output<typeof whereTag>
    | z.output<typeof whereKind>
    | z.output<typeof whereMetadata>,
    | z.input<typeof whereTag>
    | z.input<typeof whereKind>
    | z.input<typeof whereMetadata>
  > {}
const whereTagKindMetadata: ZWhereTagKindMetadata = z.union([
  whereTag,
  whereKind,
  whereMetadata,
])

export interface ZWhereParticipant extends
  z.ZodType<
    {
      participant: 'source' | 'target'
      operator: z.output<ZWhereTagKindMetadata>
    },
    {
      participant: 'source' | 'target'
      operator: z.input<ZWhereTagKindMetadata>
    }
  > {}
export const whereParticipant: ZWhereParticipant = z.strictObject({
  participant: z.enum(['source', 'target']),
  operator: whereTagKindMetadata,
})

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
  export type Out =
    | z.output<ZWhereTagKindMetadata>
    | z.output<ZWhereParticipant>
    | { and: ZWhereOperator.Out[] }
    | { or: ZWhereOperator.Out[] }
    | { not: ZWhereOperator.Out }
  export type In =
    | z.input<ZWhereTagKindMetadata>
    | z.input<ZWhereParticipant>
    | { and: ZWhereOperator.In[] }
    | { or: ZWhereOperator.In[] }
    | { not: ZWhereOperator.In }
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
export interface ZWildcardExpr extends z.ZodType<{ wildcard: true }, { wildcard: true }> {}
export const wildcardExpr: ZWildcardExpr = z.strictObject({ wildcard: z.literal(true) })

export interface ZRefExpr extends
  z.ZodType<{
    ref: ZFqnRef.Out
    selector?: z.output<typeof selector>
  }, {
    ref: ZFqnRef.In
    selector?: z.input<typeof selector> | null | undefined
  }> {}
export const refExpr: ZRefExpr = z.object({
  ref: fqnRef,
  selector: selector.nullish(),
}).transform(pickBy(isNonNullish))

export interface ZElementKindExpr extends
  z.ZodType<{
    elementKind: scalar.ElementKind
    isEqual: boolean
  }, {
    elementKind: string
    isEqual: boolean
  }> {}
export const elementKindExpr: ZElementKindExpr = z.object({
  elementKind: common.kind,
  isEqual: z.boolean(),
})

export interface ZElementTagExpr extends
  z.ZodType<{
    elementTag: scalar.Tag
    isEqual: boolean
  }, {
    elementTag: string
    isEqual: boolean
  }> {}
export const elementTagExpr: ZElementTagExpr = z.object({
  elementTag: common.tag,
  isEqual: z.boolean(),
})

export namespace ZFqnExpr {
  export type Out = z.output<ZWildcardExpr | ZRefExpr | ZElementTagExpr | ZElementKindExpr>
  export type In = z.input<ZWildcardExpr | ZRefExpr | ZElementTagExpr | ZElementKindExpr>
}
export interface ZFqnExpr extends
  z.ZodType<
    ZFqnExpr.Out,
    ZFqnExpr.In
  > {}
export const fqnExpr: ZFqnExpr = z.union([
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

export interface ZFqnExprOrWhere extends
  z.ZodType<
    | ZFqnExpr.Out
    | {
      where: {
        expr: ZFqnExpr.Out
        condition: ZWhereOperator.Out
      }
    },
    | ZFqnExpr.In
    | {
      where: {
        expr: ZFqnExpr.In
        condition: ZWhereOperator.In
      }
    }
  > {}
export const fqnExprOrWhere: ZFqnExprOrWhere = z.union([
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
  sizing: common.sizing,
}).partial()

const customRelationProperties = z.object({
  ...commonCustomProperties.shape,
  line: common.line,
  head: common.arrow,
  tail: common.arrow,
}).partial()

export interface ZFqnExprCustom extends
  z.ZodType<{
    custom: Simplify<{ expr: z.output<ZFqnExprOrWhere> } & z.output<typeof customElementProperties>>
  }, {
    custom: Simplify<{ expr: z.input<ZFqnExprOrWhere> } & z.input<typeof customElementProperties>>
  }> {}
export const fqnExprCustom: ZFqnExprCustom = z.strictObject({
  custom: customElementProperties.extend({
    expr: fqnExprOrWhere,
  }),
})

export const fqnExprAny = z.union([
  fqnExprOrWhere,
  fqnExprCustom,
])

// ---- ModelRelationExpr base variants ----

export const directRelationExpr = z.strictObject({
  source: fqnExpr,
  target: fqnExpr,
  isBidirectional: z.boolean().optional(),
})
export const incomingRelationExpr = z.object({ incoming: fqnExpr })
export const outgoingRelationExpr = z.object({ outgoing: fqnExpr })
export const inoutRelationExpr = z.object({ inout: fqnExpr })

export namespace ZRelationExpr {
  export type Out = z.output<
    | typeof directRelationExpr
    | typeof incomingRelationExpr
    | typeof outgoingRelationExpr
    | typeof inoutRelationExpr
  >

  export type In = z.input<
    | typeof directRelationExpr
    | typeof incomingRelationExpr
    | typeof outgoingRelationExpr
    | typeof inoutRelationExpr
  >
}
export interface ZRelationExpr extends
  z.ZodType<
    ZRelationExpr.Out,
    ZRelationExpr.In
  > {}
export const relationExpr: ZRelationExpr = z.union([
  directRelationExpr,
  incomingRelationExpr,
  outgoingRelationExpr,
  inoutRelationExpr,
])

const relationExprWhere = z.strictObject({
  where: z.strictObject({
    expr: relationExpr,
    condition: whereOperator,
  }),
})

export interface ZRelationExprOrWhere extends
  z.ZodType<
    ZRelationExpr.Out | z.output<typeof relationExprWhere>,
    ZRelationExpr.In | z.input<typeof relationExprWhere>
  > {}
export const relationExprOrWhere: ZRelationExprOrWhere = z.union([
  relationExpr,
  relationExprWhere,
])

export interface ZRelationExprCustom extends
  z.ZodType<
    {
      customRelation:
        & { expr: z.output<ZRelationExprOrWhere> }
        & z.output<typeof customRelationProperties>
    },
    {
      customRelation: { expr: z.input<ZRelationExprOrWhere> } & z.input<typeof customRelationProperties>
    }
  > {}
export const relationExprCustom: ZRelationExprCustom = z.strictObject({
  customRelation: customRelationProperties.extend({
    expr: relationExprOrWhere,
  }),
})

export interface ZRelationExprAny extends
  z.ZodType<
    z.output<ZRelationExprOrWhere | ZRelationExprCustom>,
    z.input<ZRelationExprOrWhere | ZRelationExprCustom>
  > {}
export const relationExprAny: ZRelationExprAny = z.union([
  relationExprOrWhere,
  relationExprCustom,
])

// Where expression - wraps either a fqn or relation base expression with a condition
export interface ZWhereExpr extends
  z.ZodType<
    {
      where: {
        expr: z.output<ZFqnExpr> | z.output<ZRelationExpr>
        condition: z.output<ZWhereOperator>
      }
    },
    {
      where: {
        expr: z.input<ZFqnExpr> | z.input<ZRelationExpr>
        condition: z.input<ZWhereOperator>
      }
    }
  > {}
export const whereExpr: ZWhereExpr = z.strictObject({
  where: z.object({
    expr: z.xor([
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
export type ZExpression = typeof expression
export namespace ZExpression {
  export type Out = z.output<ZExpression>
  export type In = z.input<ZExpression>
}
