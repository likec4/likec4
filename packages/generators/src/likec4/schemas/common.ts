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
  type Link,
  type scalar,
  exact,
} from '@likec4/core/types'
import * as z from 'zod/v4'

export const id = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'id must consist of alphanumeric characters, underscores or hyphens')

export const viewId = id.transform(value => value as unknown as scalar.ViewId)

export const fqn = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'FQN must consist of alphanumeric characters, dots, underscores or hyphens')
  .transform(value => value as unknown as scalar.Fqn)

export const kind = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Kind must consist of alphanumeric characters, underscores or hyphens')
  .transform(value => value as unknown as scalar.ElementKind)

export const opacity = z
  .int()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')

export const shape = z.literal(ElementShapes)

export const icon = z.string().nonempty('Icon cannot be empty').transform(value => value as unknown as scalar.Icon)

export const border = z
  .literal(BorderStyles)

export const size = z.literal(Sizes)

export const iconPosition = z
  .literal(IconPositions)

export const arrow = z
  .literal(RelationshipArrowTypes)

export const line = z
  .literal(['dashed', 'solid', 'dotted'])

export const link = z.union([
  z.string(),
  z.object({
    title: z.string().optional(),
    url: z.string(),
  }),
]).transform(
  value => exact(typeof value === 'string' ? { url: value } : value) as Link,
)

export const links = z.array(link).readonly()

export const themeColor = z.literal(ThemeColors)

export const customColor = z
  .custom<string & Record<never, never>>()
  .refine(v => typeof v === 'string', 'Custom color name must be a string')
  .transform(value => value as unknown as CustomColor)

export const tag = z
  .string()
  .nonempty('Tag cannot be empty')
  .transform(tag => (tag.startsWith('#') ? tag.slice(1) : tag) as unknown as scalar.Tag)

export const tags = z.array(tag).readonly()

export const markdownOrString = z.union([
  z.string(),
  z.strictObject({ md: z.string() }),
  z.strictObject({ txt: z.string() }),
]).transform(v => (typeof v === 'string' ? { txt: v } : v) as scalar.MarkdownOrString)

export const color = themeColor.or(customColor)

export const style = z
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

export const metadataValue = z.union([z.string(), z.boolean(), z.number()]).transform(value => `${value}`)

export const metadata = z.record(z.string(), metadataValue.or(z.array(metadataValue)))

export const props = z
  .object({
    tags: tags.nullable(),
    title: z.string(),
    summary: markdownOrString.nullable(),
    description: markdownOrString.nullable(),
    notation: z.string().nullable(),
    technology: z.string().nullable(),
    links: links.nullable(),
    metadata: metadata,
  })
  // all properties are optional, as the generator should be able to handle missing fields and provide defaults
  .partial()
