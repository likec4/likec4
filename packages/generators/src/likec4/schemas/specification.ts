import type {
  ElementSpecification,
  RelationshipSpecification,
} from '@likec4/core/types'
import { isNonNullish, mapToObj, pickBy } from 'remeda'
import * as z from 'zod/v4'
import * as common from './common'

/**
 * Replicates the {@link ElementSpecification} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const element = z
  .object({
    tags: common.tags.nullable(),
    title: z.string().nullable(),
    summary: common.markdownOrString.nullable(),
    description: common.markdownOrString.nullable(),
    technology: z.string().nullable(),
    notation: z.string().nullable(),
    links: common.links.nullable(),
    style: common.style.nullable(),
  })
  .partial()
  .transform(pickBy(isNonNullish))

/**
 * Replicates the {@link RelationshipSpecification} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const relationship = z
  .object({
    technology: z.string().nullable(),
    notation: z.string().nullable(),
    color: common.color.nullable(),
    line: common.line.nullable(),
    head: common.arrow.nullable(),
    tail: common.arrow.nullable(),
  })
  .partial()
  .transform(pickBy(isNonNullish))

export const tagSpec = z
  .object({
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional()
      .catch(undefined),
  })
  .partial()
  .transform(pickBy(isNonNullish))

export const schema = z
  .object({
    /**
     * Element kinds specifications, where key is the kind name
     */
    elements: z.record(common.kind, element),

    /**
     * Relationship kinds specifications, where key is the kind name
     */
    relationships: z.record(common.kind, relationship),

    /**
     * Tag specifications, where key is the tag name
     * Or an array of tags, if no additional properties are needed for tags (like color)
     */
    tags: z.union([
      z.record(
        common.tag,
        tagSpec,
      ),
      z.array(common.tag).transform(tags => mapToObj(tags, t => [t, {} as Record<string, any>] as const)),
    ]),
  })
  .partial()
