import type { UnwrapTagged } from 'type-fest'
import type { Element, ElementKind, ElementKindSpecification, Fqn, Tag } from './element'
import type { Relation, RelationID, RelationshipKindSpecification } from './relation'
import type { ComputedView, DiagramView, LikeC4View, ViewID } from './view'

/**
 * Parsed elements, relations, and views.
 */
export interface ParsedLikeC4Model {
  specification: {
    tags: Tag[]
    elements: Record<UnwrapTagged<ElementKind>, ElementKindSpecification>
    relationships: Record<UnwrapTagged<ElementKind>, RelationshipKindSpecification>
  }
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, LikeC4View>
}

/**
 * Same as `ParsedLikeC4Model` but with computed views.
 */
export interface ComputedLikeC4Model extends Omit<ParsedLikeC4Model, 'views'> {
  views: Record<ViewID, ComputedView>
}

/**
 * Same as `ParsedLikeC4Model` but with layouted views (DiagramView)
 */
export interface LayoutedLikeC4Model extends Omit<ParsedLikeC4Model, 'views'> {
  views: Record<ViewID, DiagramView>
}
