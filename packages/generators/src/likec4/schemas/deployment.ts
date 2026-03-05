import {
  RelationId,
} from '@likec4/core/types'
import { produce } from 'immer'
import { indexBy, isArray, isNonNullish, pickBy, prop, randomString } from 'remeda'
import * as z from 'zod/v4'
import * as common from './common'
import * as expression from './expression'

export const node = common.props
  .extend({
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
  .readonly()
  .transform(value => {
    const { shape, color, icon, ...rest } = value
    if (shape || color || icon) {
      return produce(rest, draft => {
        draft.style = rest.style || {}
        draft.style.shape = shape ?? rest.style?.shape
        draft.style.color = color ?? rest.style?.color
        draft.style.icon = icon ?? rest.style?.icon
      })
    }
    return rest
  })
  .transform(pickBy(isNonNullish))

export const instance = common.props
  .extend({
    id: common.fqn,
    element: common.fqn,
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
  .readonly()
  .transform(value => {
    const { shape, color, icon, ...rest } = value
    if (shape || color || icon) {
      return produce(rest, draft => {
        draft.style = rest.style || {}
        draft.style.shape = shape ?? rest.style?.shape
        draft.style.color = color ?? rest.style?.color
        draft.style.icon = icon ?? rest.style?.icon
      })
    }
    return rest
  })
  .transform(pickBy(isNonNullish))

const relationshipEndpoint = expression.refDeployment

const relationshipId = common.id.transform(value => value as unknown as RelationId)

export const relationship = common.props
  .extend({
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
  .readonly()
  .transform(pickBy(isNonNullish))

// ============ Top-Level Schema ============

export const element = z.union([node, instance])

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
  })
