import {
  RelationId,
} from '@likec4/core/types'
import { produce } from 'immer'
import { indexBy, isArray, isNonNullish, pickBy, prop, randomString } from 'remeda'
import * as z from 'zod/v4'
import * as common from './common'

// export const elementTree = z.object({
//     id: common.fqn.optional(),
//     name: common.id.optional(),
//     kind: common.kind,
//     style: common.style.optional(),
//     /**
//      * Allowing shape, color and icon to be defined at the element level for convenience,
//      * they will be moved to the style property during parsing
//      * (and will override properties)
//      */
//     shape: common.shape.optional(),
//     color: common.color.optional(),
//     icon: common.icon.optional(),
//     get children(): z.ZodOptional<z.ZodArray<typeof elementTree>> {
//       return z.array(elementTree).optional()
//     },
//   })
// .readonly()

/**
 * Replicates the {@link Element} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const element = z
  .object({
    ...common.props.shape,
    id: common.fqn,
    kind: common.kind,
    style: common.style.optional(),
    /**
     * Allowing shape, color and icon to be defined at the element level for convenience,
     * they will be moved to the style property during parsing
     * (and will override properties)
     */
    shape: common.shape.optional(),
    color: common.color.optional(),
    icon: common.icon.optional(),
  })
  .transform(value => {
    let { shape, color, icon, ...rest } = value
    if (shape || color || icon) {
      rest = produce(rest, draft => {
        draft.style = rest.style || {}
        draft.style.shape = shape ?? rest.style?.shape
        draft.style.color = color ?? rest.style?.color
        draft.style.icon = icon ?? rest.style?.icon
      })
    }
    return pickBy(rest, isNonNullish)
  })
  .readonly()

const relationshipEndpoint = z.union([
  common.fqn,
  z.strictObject({
    model: common.fqn,
  }),
]).transform(v => (typeof v === 'string' ? { model: v } : v))

const relationshipId = common.id.transform(value => value as unknown as RelationId)

export const relationship = z.object({
  ...common.props.shape,
  id: relationshipId.optional(),
  title: z.string().nullish(),
  source: relationshipEndpoint,
  target: relationshipEndpoint,
  navigateTo: common.viewId.nullish(),
  color: common.color.nullish(),
  kind: common.kind.nullish(),
  line: common.line.nullish(),
  head: common.arrow.nullish(),
  tail: common.arrow.nullish(),
})
  .transform(pickBy(isNonNullish))
  .readonly()

// ============ Top-Level Schema ============

const elements = z.record(common.fqn, element)
const relationships = z.record(relationshipId, relationship)

const genRelationshipId = (r: z.output<typeof relationship>): RelationId => r.id ?? randomString(8) as RelationId

export const schema = z
  .object({
    elements: z
      .union([
        elements,
        z.array(element),
      ])
      .transform(v => isArray(v) ? indexBy(v, prop('id')) as unknown as z.output<typeof elements> : v)
      .optional(),
    relations: z
      .union([
        relationships,
        z.array(relationship),
      ])
      .transform(v => isArray(v) ? indexBy(v, genRelationshipId) as unknown as z.output<typeof relationships> : v)
      .optional(),
    //     isArray(v) ?
    //       indexBy(
    //         v,
    //         (r, idx) => r.id as string ?? stringHash(`${r.source.model}, ${r.target.model}, ${r.kind ?? ''}, ${idx}`),
    //       ) :
    //       v
    //   )
    //   .optional(),
    // views: z.union([
    //   z.record(viewId, ElementViewSchema),
    //   z.array(ElementViewSchema)
    //     .transform(indexBy(v => v.id as string)),
    // ]),
    // project: z.object({
    //   id: z.string(),
    //   styles: LikeC4StylesConfigSchema.nullish(),
    // }),
    // specification: SpecificationSchema,
  })
