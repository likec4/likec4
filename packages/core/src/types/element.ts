import type { Opaque } from 'type-fest'

// Full-qualified-name
export type Fqn = Opaque<string, 'Fqn'>

export function Fqn(name: string, parent?: Fqn | null) {
  return (parent ? parent + '.' + name : name) as Fqn
}

export type ElementKind = Opaque<string, 'ElementKind'>

export type ThemeColor = 'primary' | 'secondary' | 'muted'
export type ElementShape = 'rectangle' | 'person' | 'browser' | 'cylinder' | 'storage' | 'queue'

export const DefaultThemeColor: ThemeColor = 'primary'
export const DefaultElementShape: ElementShape = 'rectangle'

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
  readonly description?: string
  readonly tags?: Tag[]
  readonly shape?: ElementShape
  readonly color?: ThemeColor
}
