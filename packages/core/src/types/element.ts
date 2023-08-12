import type { IconUrl, NonEmptyArray } from './_common'
import type { Opaque } from './opaque'
import type { ThemeColor } from './theme'

// Full-qualified-name
export type Fqn = Opaque<string, 'Fqn'>

export function AsFqn(name: string, parent?: Fqn | null) {
  return (parent ? parent + '.' + name : name) as Fqn
}

export type ElementKind = Opaque<string, 'ElementKind'>
export type ElementShape =
  | 'rectangle'
  | 'person'
  | 'browser'
  | 'mobile'
  | 'cylinder'
  | 'storage'
  | 'queue'

export const DefaultThemeColor = 'primary' satisfies ThemeColor
export const DefaultElementShape = 'rectangle' satisfies ElementShape

export interface ElementStyle {
  shape?: ElementShape
}

export type Tag = Opaque<string, 'Tag'>

export interface TagSpec {
  readonly id: Tag
  readonly style: ElementStyle
}

export interface Element {
  readonly id: Fqn
  readonly kind: ElementKind
  readonly title: string
  readonly description: string | null
  readonly technology: string | null
  readonly tags: NonEmptyArray<Tag> | null
  readonly links: NonEmptyArray<string> | null
  readonly icon?: IconUrl
  readonly shape?: ElementShape
  readonly color?: ThemeColor
}
