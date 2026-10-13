import type {
  Fqn,
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
const _element = z
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
        if (shape) {
          draft.style.shape = shape
        }
        if (color) {
          draft.style.color = color
        }
        if (icon) {
          draft.style.icon = icon
        }
      })
    }
    return pickBy(rest, isNonNullish)
  })
  .readonly()
export interface ZElement extends z.ZodType<z.output<typeof _element>, z.input<typeof _element>> {}
export const element: ZElement = _element

export interface ZRelationshipEndpoint extends z.ZodType<{ readonly model: Fqn }, string | { model: string }> {}
export const relationshipEndpoint: ZRelationshipEndpoint = z.union([
  common.fqn,
  z.strictObject({
    model: common.fqn,
  }),
]).transform(v => (typeof v === 'string' ? { model: v } : v))

export interface ZRelationshipId extends z.ZodType<RelationId, string> {}
export const relationshipId: ZRelationshipId = common.id.transform(value => value as unknown as RelationId)

const _relationship = z.object({
  ...common.props.shape,
  id: relationshipId.optional(),
  title: z.string().nullish(),
  source: relationshipEndpoint,
  target: relationshipEndpoint,
  isBidirectional: z.boolean().nullish(),
  navigateTo: common.viewId.nullish(),
  color: common.color.nullish(),
  kind: common.kind.nullish(),
  line: common.line.nullish(),
  head: common.arrow.nullish(),
  tail: common.arrow.nullish(),
})
  .transform(pickBy(isNonNullish))
  .readonly()
export interface ZRelationship extends z.ZodType<z.output<typeof _relationship>, z.input<typeof _relationship>> {}
export const relationship: ZRelationship = _relationship

// ============ Top-Level Schema ============

export const elements = z.record(common.fqn, element)
export const relationships = z.record(relationshipId, relationship)

const genRelationshipId = (r: z.output<typeof relationship>): RelationId => r.id ?? randomString(8) as RelationId

const modelElements = z.union([
  elements,
  z.array(element).transform(v => indexBy(v, prop('id'))),
]) as z.ZodType<
  Record<Fqn, z.output<typeof element>>,
  Record<string, z.input<typeof element>> | Array<z.input<typeof element>>
>

const modelRelationships = z.union([
  relationships,
  z.array(relationship).transform(v => indexBy(v, genRelationshipId)),
]) as z.ZodType<
  Record<RelationId, z.output<ZRelationship>>,
  Record<string, z.input<ZRelationship>> | Array<z.input<ZRelationship>>
>

export const schema = z
  .object({
    elements: modelElements.optional(),
    relations: modelRelationships.optional(),
  })
