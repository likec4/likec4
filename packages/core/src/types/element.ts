import type { Tagged, TupleToUnion } from 'type-fest'
import type { IconUrl, NonEmptyArray } from './_common'
import type { Color, ThemeColor } from './theme'

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
  'queue'
] as const

export type ElementShape = TupleToUnion<typeof ElementShapes>
export const DefaultThemeColor = 'primary' satisfies ThemeColor
export const DefaultElementShape = 'rectangle' satisfies ElementShape

export interface ElementStyle {
  border?: BorderStyle
  // 0-100
  opacity?: number
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
  MetadataKeys extends string = never
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
}
export interface ElementKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly style: ElementKindSpecificationStyle
}
