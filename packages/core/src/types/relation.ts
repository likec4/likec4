import type { Opaque } from './opaque'
import type { Fqn, Tag } from './element'
import type { ThemeColor } from './theme'

export type RelationID = Opaque<string, 'RelationID'>
export type RelationshipKind = Opaque<string, 'RelationshipKind'>

export type RelationshipLineType = 'dashed' | 'solid' | 'dotted'

// reference: https://graphviz.org/docs/attr-types/arrowType/
export type RelationshipArrowType =
  | 'none'
  | 'normal'
  | 'onormal'
  | 'diamond'
  | 'odiamond'
  | 'crow'
  | 'open'
  | 'vee'

export const DefaultLineStyle = 'dashed' satisfies RelationshipLineType
export const DefaultArrowType = 'normal' satisfies RelationshipArrowType
export const DefaultRelationshipColor = 'gray' satisfies ThemeColor

export interface Relation {
  readonly id: RelationID
  readonly source: Fqn
  readonly target: Fqn
  readonly title: string
  readonly tags?: Tag[]
  readonly kind?: RelationshipKind
  readonly color?: ThemeColor
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
}
