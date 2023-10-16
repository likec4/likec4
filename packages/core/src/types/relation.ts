import type { Opaque } from './opaque'
import type { Fqn, Tag } from './element'
import type { ThemeColor } from './theme'

export type RelationID = Opaque<string, 'RelationID'>
export type RelationshipKind = Opaque<string, 'RelationshipKind'>


export type RelationshipLineType =  'solid' | 'dashed' | 'dotted'
export type RelationshipArrowType = 'diamond' | 'ediamond' | 'empty' | 'none' | 'normal' | 'open';

export const DefaultLineStyle = 'solid' satisfies RelationshipLineType
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
