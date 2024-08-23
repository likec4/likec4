import type { IconUrl, NonEmptyArray } from './_common'
import type { Opaque } from './opaque'
import type { ThemeColor } from './theme'

// Full-qualified-name
export type Fqn = Opaque<string, 'Fqn'>

export function AsFqn(name: string, parent?: Fqn | null) {
  return (parent ? parent + '.' + name : name) as Fqn
}

export const BorderStyles = ['solid', 'dashed', 'dotted', 'none'] as const

export type BorderStyle = typeof BorderStyles[number]

export type ElementKind = Opaque<string, 'ElementKind'>
export const ElementShapes = [
  'rectangle',
  'person',
  'browser',
  'mobile',
  'cylinder',
  'storage',
  'queue'
] as const

export type ElementShape = typeof ElementShapes[number]
export const DefaultThemeColor = 'primary' satisfies ThemeColor
export const DefaultElementShape = 'rectangle' satisfies ElementShape

export interface ElementStyle {
  border?: BorderStyle
  // 0-100
  opacity?: number
}

export type Tag = Opaque<string, 'Tag'>

export interface TagSpec {
  readonly id: Tag
  readonly style: ElementStyle
}

export interface Link {
  readonly title?: string,
  readonly url: string
}

export interface Element {
  readonly id: Fqn
  readonly kind: ElementKind
  readonly title: string
  readonly description: string | null
  readonly technology: string | null
  readonly tags: NonEmptyArray<Tag> | null
  readonly links: NonEmptyArray<Link> | null
  readonly icon?: IconUrl
  readonly shape?: ElementShape
  readonly color?: ThemeColor
  readonly style?: ElementStyle
  readonly notation?: string
  readonly metadata?: { [key: string]: string }
}

export interface ElementKindSpecificationStyle {
  shape?: ElementShape
  icon?: IconUrl
  color?: ThemeColor
  border?: BorderStyle
  opacity?: number
}
export interface ElementKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly style: ElementKindSpecificationStyle
}
