import type { ElementKindSpecification, Tag, TypedElement } from './element'
import type { Relation, RelationID, RelationshipKindSpecification } from './relation'
import type { ComputedView, DiagramView, LikeC4View, ViewID } from './view'

/**
 * Parsed elements, relations, and views.
 */
export interface ParsedLikeC4Model<
  ElementKinds extends string = string,
  RelationKinds extends string = string,
  Tags extends string = string,
  Fqns extends string = string,
  Views extends string = string
> {
  specification: {
    tags: Tag<Tags>[]
    elements: Record<ElementKinds, ElementKindSpecification>
    relationships: Record<RelationKinds, RelationshipKindSpecification>
  }
  elements: Record<Fqns, TypedElement<Fqns, ElementKinds, Tags>>
  relations: Record<RelationID, Relation>
  views: Record<ViewID<Views>, LikeC4View<Views, Tags>>
}

/**
 * Same as `ParsedLikeC4Model` but with computed views.
 */
export interface ComputedLikeC4Model extends Omit<ParsedLikeC4Model, 'views'> {
  __?: never
  views: Record<ViewID, ComputedView>
}

/**
 * Same as `ParsedLikeC4Model` but with layouted views (DiagramView)
 */
export interface LayoutedLikeC4Model extends Omit<ParsedLikeC4Model, 'views'> {
  __: 'layouted'
  views: Record<ViewID, DiagramView>
}
