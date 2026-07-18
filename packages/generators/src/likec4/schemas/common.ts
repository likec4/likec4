import {
  type RelationshipArrowType,
  type RelationshipLineType,
  BorderStyles,
  ElementShapes,
  IconPositions,
  RelationshipArrowTypes,
  RelationshipLineTypes,
  Sizes,
  ThemeColors,
} from '@likec4/core/styles'
import {
  type BorderStyle,
  type Color,
  type CustomColor,
  type ElementShape,
  type IconPosition,
  type IconSize,
  type Link,
  type OrString,
  type scalar,
  type Size,
  type SpacingSize,
  type TextSize,
  type ThemeColor,
  exact,
} from '@likec4/core/types'
import { isNonNullish, pickBy } from 'remeda'
import * as z from 'zod/v4'

export const id = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'id must consist of alphanumeric characters, underscores or hyphens')

// cast to reduce types output size
export interface ZViewId extends z.ZodType<scalar.ViewId, string> {}
export const viewId: ZViewId = id.transform(value => value as unknown as scalar.ViewId)

// cast to reduce types output size
export interface ZFqn extends z.ZodType<scalar.Fqn, string> {}
export const fqn: ZFqn = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'FQN must consist of alphanumeric characters, dots, underscores or hyphens')
  .transform(value => value as unknown as scalar.Fqn)

// cast to reduce types output size
export interface ZKind extends z.ZodType<scalar.ElementKind, string> {}
export const kind: ZKind = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Kind must consist of alphanumeric characters, underscores or hyphens')
  .transform(value => value as unknown as scalar.ElementKind)

export const opacity = z
  .int()
  .min(0, 'Opacity must be between 0 and 100')
  .max(100, 'Opacity must be between 0 and 100')

export interface ZShape extends z.ZodType<ElementShape, ElementShape | OrString> {}
export const shape: ZShape = z.literal(ElementShapes)

export interface ZIcon extends z.ZodType<scalar.Icon, string> {}
export const icon: ZIcon = z
  .string()
  .nonempty('Icon cannot be empty')
  .transform(value => value as unknown as scalar.Icon)

export interface ZBorder extends z.ZodType<BorderStyle, BorderStyle | OrString> {}
export const border: ZBorder = z.literal(BorderStyles)

export interface ZSize extends z.ZodType<Size, Size | OrString> {}
export const size: ZSize = z.literal(Sizes)

export interface ZIconPosition extends z.ZodType<IconPosition, IconPosition | OrString> {}
export const iconPosition: ZIconPosition = z.literal(IconPositions)

export interface ZArrow extends z.ZodType<RelationshipArrowType, RelationshipArrowType | OrString> {}
export const arrow: ZArrow = z.literal(RelationshipArrowTypes)

export interface ZLine extends z.ZodType<RelationshipLineType, RelationshipLineType | OrString> {}
export const line: ZLine = z.literal(RelationshipLineTypes)

export interface ZLink extends z.ZodType<Link, string | { url: string; title?: string | undefined }> {}
export const link: ZLink = z.union([
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

export const customColor: z.ZodType<CustomColor, string> = z
  .string()
  .nonempty('Custom color name cannot be empty')
  .transform(value => value as unknown as CustomColor)

export interface ZTag extends z.ZodType<scalar.Tag, string> {}
export const tag: ZTag = z
  .string()
  .nonempty('Tag cannot be empty')
  .transform(tag => (tag.startsWith('#') ? tag.slice(1) : tag) as unknown as scalar.Tag)

export const tags = z.array(tag).readonly()

export type MarkdownOrStringInput =
  | string
  | { txt: string }
  | { md: string }

export interface ZMarkdownOrString extends z.ZodType<scalar.MarkdownOrString, MarkdownOrStringInput> {}

export const markdownOrString: ZMarkdownOrString = z.union([
  z.string().transform(v => ({ txt: v })),
  z.strictObject({ md: z.string() }),
  z.strictObject({ txt: z.string() }),
])

export interface ZColor extends z.ZodType<Color, ThemeColor | OrString> {}
export const color: ZColor = themeColor.or(customColor)

/**
 * @internal reduce type inference
 */
export namespace ZStyle {
  export type In = {
    shape?: z.input<ZShape> | undefined
    icon?: string | undefined
    iconColor?: z.input<ZColor> | undefined
    iconSize?: z.input<ZSize> | undefined
    iconPosition?: z.input<ZIconPosition> | undefined
    color?: z.input<ZColor> | undefined
    border?: z.input<ZBorder> | undefined
    opacity?: number | undefined
    size?: z.input<ZSize> | undefined
    padding?: z.input<ZSize> | undefined
    textSize?: z.input<ZSize> | undefined
    multiple?: boolean | undefined
  }
  export interface Out {
    readonly shape?: ElementShape
    readonly icon?: string
    readonly iconColor?: Color
    readonly iconSize?: IconSize
    readonly iconPosition?: IconPosition
    readonly color?: Color
    readonly border?: BorderStyle
    readonly opacity?: number
    readonly size?: Size
    readonly padding?: SpacingSize
    readonly textSize?: TextSize
    readonly multiple?: boolean
  }
}
export interface ZStyle extends z.ZodType<ZStyle.Out, ZStyle.In> {}

export const style: ZStyle = z
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
  .transform(pickBy(isNonNullish))

export const metadataValue = z.union([z.string(), z.boolean(), z.number()])

export const metadata = z.record(z.string(), metadataValue.or(z.array(metadataValue)))

export const props = z
  .object({
    tags: tags.nullish(),
    title: z.string().nullish(),
    summary: markdownOrString.nullish(),
    description: markdownOrString.nullish(),
    notation: z.string().nullish(),
    technology: z.string().nullish(),
    links: links.nullish(),
    metadata: metadata.nullish(),
  })
