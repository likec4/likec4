import type {
  DeploymentElement,
  DeploymentNodeKind,
  DeploymentNodeKindSpecification,
  DeploymentRelation
} from './deployments'
import type { ElementKindSpecification, Fqn, Tag, TypedElement } from './element'
import type { ModelGlobals } from './global'
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
    deployments: Record<DeploymentNodeKind, DeploymentNodeKindSpecification>
    relationships: Record<RelationKinds, RelationshipKindSpecification>
  }
  elements: Record<Fqns, TypedElement<Fqns, ElementKinds, Tags>>
  relations: Record<RelationID, Relation>
  globals: ModelGlobals
  views: Record<Views, LikeC4View<Views, Tags>>
  /**
   * Deployment Model.
   */
  deployments: {
    elements: Record<Fqn, DeploymentElement>
    relations: Record<RelationID, DeploymentRelation>
  }
}

export interface ALikeC4Model<T = 'computed' | 'layouted'> extends Omit<ParsedLikeC4Model, 'views'> {
  __?: T
  views: Record<ViewID, ComputedView | DiagramView>
}

/**
 * Same as `ParsedLikeC4Model` but with computed views.
 */
export interface ComputedLikeC4Model extends Omit<ALikeC4Model<'computed'>, 'views'> {
  views: Record<ViewID, ComputedView>
}

/**
 * Same as `ParsedLikeC4Model` but with layouted views (DiagramView)
 */
export interface LayoutedLikeC4Model extends Omit<ALikeC4Model<'layouted'>, 'views'> {
  __: 'layouted'
  views: Record<ViewID, DiagramView>
}
