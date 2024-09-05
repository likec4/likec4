import type { Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { Fqn, Link, Tag } from './element'
import type { Color, ThemeColor } from './theme'

export type RelationID = Tagged<string, 'RelationID'>
export type RelationshipKind = Tagged<string, 'RelationshipKind'>

export type RelationshipLineType = 'dashed' | 'solid' | 'dotted'

// reference: https://graphviz.org/docs/attr-types/arrowType/
export type RelationshipArrowType =
  | 'none'
  | 'normal'
  | 'onormal'
  | 'dot'
  | 'odot'
  | 'diamond'
  | 'odiamond'
  | 'crow'
  | 'open'
  | 'vee'

export const DefaultLineStyle = 'dashed' satisfies RelationshipLineType
export const DefaultArrowType = 'normal' satisfies RelationshipArrowType
export const DefaultRelationshipColor = 'gray' satisfies ThemeColor

// TODO: rename to Relationship
export interface Relation {
  readonly id: RelationID
  readonly source: Fqn
  readonly target: Fqn
  readonly title: string
  readonly description?: string
  readonly technology?: string
  readonly tags?: NonEmptyArray<Tag>
  readonly kind?: RelationshipKind
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly links?: NonEmptyArray<Link>
  readonly metadata?: { [key: string]: string }
}

export interface RelationshipKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly color?: ThemeColor
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
}
