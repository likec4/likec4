import type { Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { Fqn, Link, Tag } from './element'
import type { Color, ThemeColor } from './theme'
import type { ViewId } from './view'

export type RelationId = Tagged<string, 'RelationID'>
export type RelationshipKind<Kinds extends string = string> = Tagged<Kinds, 'RelationshipKind'>

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

export const DefaultLineStyle: RelationshipLineType = 'dashed'
export const DefaultArrowType: RelationshipArrowType = 'normal'
export const DefaultRelationshipColor: ThemeColor = 'gray'

export interface AbstractRelation {
  readonly id: RelationId
  readonly title?: string
  readonly description?: string
  readonly technology?: string
  readonly tags?: NonEmptyArray<Tag> | null
  readonly kind?: RelationshipKind
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly links?: NonEmptyArray<Link> | null
  // Link to dynamic view
  readonly navigateTo?: ViewId
  readonly metadata?: { [key: string]: string }
}

// TODO: rename to Relationship
export interface ModelRelation extends AbstractRelation {
  readonly source: Fqn
  readonly target: Fqn
  readonly title: string
}

export interface RelationshipKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
}
