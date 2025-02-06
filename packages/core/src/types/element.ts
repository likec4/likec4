import type { Tagged, TupleToUnion } from 'type-fest'
import type { IconUrl, NonEmptyArray } from './_common'
import type { Color, ShapeSize, SpacingSize, TextSize, ThemeColor } from './theme'

// Full-qualified-name
export type Fqn<Id extends string = string> = Tagged<Id, 'Fqn'>

export function AsFqn(name: string, parent?: Fqn | null) {
  return (parent ? parent + '.' + name : name) as Fqn
}

export const BorderStyles = ['solid', 'dashed', 'dotted', 'none'] as const

export type BorderStyle = TupleToUnion<typeof BorderStyles>

export type ElementKind<Kinds extends string = string> = Tagged<Kinds, 'ElementKind'>
export namespace ElementKind {
  export const Group = '@group' as ElementKind
}
export const ElementShapes = [
  'rectangle',
  'person',
  'browser',
  'mobile',
  'cylinder',
  'storage',
  'queue',
] as const

export type ElementShape = TupleToUnion<typeof ElementShapes>
export const DefaultThemeColor: ThemeColor = 'primary'
export const DefaultElementShape: ElementShape = 'rectangle'
export const DefaultShapeSize: ShapeSize = 'md'
export const DefaultPaddingSize: SpacingSize = 'md'
export const DefaultTextSize: TextSize = 'md'

export interface ElementStyle {
  readonly border?: BorderStyle
  /**
   * In percentage 0-100, 0 is fully transparent
   *
   * @default 100
   */
  readonly opacity?: number
  /**
   * If true, the element is rendered as multiple shapes
   * @default false
   */
  readonly multiple?: boolean

  /**
   * Shape size
   *
   * @default 'md'
   */
  readonly size?: ShapeSize

  readonly padding?: SpacingSize

  readonly textSize?: TextSize
}

export type Tag<Tags extends string = string> = Tagged<Tags, 'Tag'>

export interface TagSpec {
  readonly id: Tag
  readonly style: ElementStyle
}

export interface Link {
  readonly title?: string
  // Value from Likec4 DSL
  readonly url: string
  // Relative to workspace root (if url is relative),
  readonly relative?: string
}

export interface TypedElement<
  Ids extends string,
  Kinds extends string,
  Tags extends string,
  MetadataKeys extends string = never,
> {
  readonly id: Fqn<Ids>
  readonly kind: ElementKind<Kinds>
  readonly title: string
  readonly description: string | null
  readonly technology: string | null
  readonly tags: NonEmptyArray<Tag<Tags>> | null
  readonly links: NonEmptyArray<Link> | null
  readonly icon?: IconUrl
  readonly shape?: ElementShape
  readonly color?: Color
  readonly style?: ElementStyle
  readonly notation?: string
  readonly metadata?: Record<MetadataKeys, string>
}

export interface Element extends TypedElement<string, string, string, string> {
}

export interface ElementKindSpecificationStyle {
  shape?: ElementShape
  icon?: IconUrl
  color?: Color
  border?: BorderStyle
  opacity?: number
  size?: ShapeSize
  padding?: SpacingSize
  textSize?: TextSize
}

export interface ElementKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly style: ElementKindSpecificationStyle
}
