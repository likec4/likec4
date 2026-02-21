import { LikeC4StylesConfigSchema } from '@likec4/config'
import {
  BorderStyles,
  ElementShapes,
  IconPositions,
  RelationshipArrowTypes,
  Sizes,
  ThemeColors,
} from '@likec4/core/styles'
import {
  type CustomColor,
  type ElementSpecification,
  type Fqn,
  type Link,
  type RelationshipSpecification,
  type scalar,
  exact,
  RelationId,
} from '@likec4/core/types'
import { stringHash } from '@likec4/core/utils'
import { produce } from 'immer'
import { fromKeys, indexBy, isEmptyish, isNonNullish, mapToObj, pickBy } from 'remeda'
import type { SetNonNullable } from 'type-fest/source/set-non-nullable'
import * as z from 'zod/v4'

const id = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'id must consist of alphanumeric characters, underscores or hyphens')

const viewId = id.transform(value => value as unknown as scalar.ViewId)

const fqn = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'FQN must consist of alphanumeric characters, dots, underscores or hyphens')
  .transform(value => value as unknown as scalar.Fqn)

const kind = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Kind must consist of alphanumeric characters, underscores or hyphens')

const opacity = z
  .int()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')

const shape = z.enum(ElementShapes)

const icon = z.string().nonempty('Icon cannot be empty')

const border = z
  .enum(BorderStyles)

const size = z.enum(Sizes)

const iconPosition = z
  .enum(IconPositions)

const arrow = z
  .enum(RelationshipArrowTypes)

const line = z
  .enum(['dashed', 'solid', 'dotted'])

const links = z.array(
  z
    .union([
      z.string(),
      z.object({
        title: z.string().optional(),
        url: z.string(),
      }),
    ])
    .transform(
      value => exact(typeof value === 'string' ? { url: value } : value) satisfies Link,
    ),
)

const themeColor = z
  .enum(ThemeColors)

const customColor = z
  .custom<string & Record<never, never>>()
  .refine(v => typeof v === 'string', 'Custom color name must be a string')
  .transform(value => value as unknown as CustomColor)

const tag = z
  .string()
  .nonempty('Tag cannot be empty')
  .transform(tag => (tag.startsWith('#') ? tag.slice(1) : tag) as unknown as scalar.Tag)

const tags = z.array(tag).readonly()

const markdownOrString = z.union([
  z.string().transform(txt => ({ txt })),
  z.strictObject({ md: z.string() }),
  z.strictObject({ txt: z.string() }),
]).transform(v => v as scalar.MarkdownOrString)

const color = themeColor.or(customColor)

export const StylePropertiesSchema = z
  .object({
    shape: shape,
    icon: icon,
    iconColor: color,
    iconSize: size,
    iconPosition: iconPosition,
    color: color,
    border: border,
    opacity: opacity,
    size: size,
    padding: size,
    textSize: size,
    multiple: z.boolean(),
  })
  .partial()

/**
 * Replicates the {@link ElementSpecification} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const ElementSpecificationSchema = z
  .object({
    tags: tags.nullable(),
    title: z.string().nullable(),
    summary: markdownOrString.nullable(),
    description: markdownOrString.nullable(),
    technology: z.string().nullable(),
    notation: z.string().nullable(),
    links: links.nullable(),
    style: StylePropertiesSchema.nullable(),
  })
  .partial()
  .transform(pickBy(isNonNullish))

export type ElementSpecificationInput = z.input<typeof ElementSpecificationSchema>
export type ElementSpecificationData = z.infer<typeof ElementSpecificationSchema>

/**
 * Replicates the {@link RelationshipSpecification} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const RelationshipSpecificationSchema = z
  .object({
    technology: z.string().nullable(),
    notation: z.string().nullable(),
    color: color.nullable(),
    line: line.nullable(),
    head: arrow.nullable(),
    tail: arrow.nullable(),
  })
  .partial()
  .transform(pickBy(isNonNullish))

export type RelationshipSpecificationInput = z.input<typeof RelationshipSpecificationSchema>
export type RelationshipSpecificationData = z.infer<typeof RelationshipSpecificationSchema>

export const SpecificationSchema = z
  .object({
    /**
     * Element kinds specifications, where key is the kind name
     */
    elements: z.record(kind, ElementSpecificationSchema),

    /**
     * Relationship kinds specifications, where key is the kind name
     */
    relationships: z.record(kind, RelationshipSpecificationSchema),

    /**
     * Tag specifications, where key is the tag name
     * Or an array of tags, if no additional properties are needed for tags (like color)
     */
    tags: z.union([
      z.record(
        tag,
        z
          .object({
            color: z
              .string()
              .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
              .optional()
              .catch(undefined),
          })
          .partial(),
      ),
      z.array(tag).transform(tags => mapToObj(tags, t => [t, {} as Record<string, any>] as const)),
    ]),
  })
  .partial()

export type SpecificationInput = z.input<typeof SpecificationSchema>
export type SpecificationData = z.infer<typeof SpecificationSchema>

const metadataValue = z.union([z.string(), z.boolean(), z.number()]).transform(value => `${value}`)

const commonProps = z
  .object({
    tags: tags.nullable(),
    title: z.string(),
    summary: markdownOrString.nullable(),
    description: markdownOrString.nullable(),
    notation: z.string(),
    technology: z.string().nullable(),
    links: links.nullable(),
    metadata: z.record(z.string(), metadataValue.or(z.array(metadataValue))),
  })
  // all properties are optional, as the generator should be able to handle missing fields and provide defaults
  .partial()

/**
 * Replicates the {@link Element} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const ElementDataSchema = commonProps
  .extend({
    id: fqn,
    kind: kind,
    style: StylePropertiesSchema.optional(),
    /**
     * Allowing shape, color and icon to be defined at the element level for convenience,
     * they will be moved to the style property during parsing
     * (and will override properties)
     */
    shape: shape.optional(),
    color: color.optional(),
    icon: icon.optional(),
  })
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
  .readonly()

export type ElementInput = z.input<typeof ElementDataSchema>
export type ElementData = z.infer<typeof ElementDataSchema>

const RelationshipEndpointSchema = z
  .strictObject({
    model: fqn,
  })
  .or(fqn.transform(value => ({ model: value })))
/**
 * Replicates the {@link Element} from the core,
 * less strict, as the generator should be able to handle missing fields and provide defaults.
 */
export const RelationshipSchema = commonProps
  .extend({
    id: id.transform(value => value as unknown as RelationId).optional(),
    source: RelationshipEndpointSchema,
    target: RelationshipEndpointSchema,
    navigateTo: viewId.nullish(),
    kind: kind.nullish(),
    color: color.nullish(),
    line: line.nullish(),
    head: arrow.nullish(),
    tail: arrow.nullish(),
  })
  .transform(pickBy(isNonNullish))
  .readonly()
export type RelationshipInput = z.input<typeof RelationshipSchema>
export type RelationshipData = z.infer<typeof RelationshipSchema>

export const LikeC4DataSchema = z
  .object({
    elements: z.union([
      z.record(fqn, ElementDataSchema),
      z.array(ElementDataSchema)
        .transform(indexBy(i => i.id)),
    ]),
    relations: z.union([
      z.record(id, RelationshipSchema),
      z.array(RelationshipSchema)
        .transform(
          indexBy((r, idx) =>
            r.id as string ?? stringHash(`${r.source.model}, ${r.target.model}, ${r.kind ?? ''}, ${idx}`)
          ),
        ),
    ]),
    project: z.object({
      id: z.string(),
      styles: LikeC4StylesConfigSchema.nullish(),
    }),
    specification: SpecificationSchema,
  })
  .partial()
  .readonly()
export type LikeC4DataInput = z.input<typeof LikeC4DataSchema>
export type LikeC4Data = z.infer<typeof LikeC4DataSchema>

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
