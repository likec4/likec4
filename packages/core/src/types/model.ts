import type {
  DeploymentElement,
  DeploymentNodeKind,
  DeploymentNodeKindSpecification,
  DeploymentRelation
} from './deployments'
import type { ElementKindSpecification, Fqn, Tag, TypedElement } from './element'
import type { ModelGlobals } from './global'
import type { Relation, RelationId, RelationshipKindSpecification } from './relation'
import type { ComputedView, DiagramView, LikeC4View, ViewId } from './view'

/**
 * Parsed elements, relations, and views.
 */
export interface ParsedLikeC4Model<
  ElementKinds extends string = string,
  RelationKinds extends string = string,
  Tags extends string = string,
  Fqns extends string = string,
  Views extends string = string,
  DeploymentFqns extends string = string
> {
  specification: {
    tags: Tag<Tags>[]
    elements: Record<ElementKinds, ElementKindSpecification>
    deployments: Record<DeploymentNodeKind, DeploymentNodeKindSpecification>
    relationships: Record<RelationKinds, RelationshipKindSpecification>
  }
  elements: Record<Fqns, TypedElement<Fqns, ElementKinds, Tags>>
  relations: Record<RelationId, Relation>
  globals: ModelGlobals
  views: Record<Views, LikeC4View<Views, Tags>>
  /**
   * Deployment Model.
   */
  deployments: {
    elements: Record<DeploymentFqns, DeploymentElement>
    relations: Record<RelationId, DeploymentRelation>
  }
}
/**
 * Hook to get types from dump
 */
export type ParsedLikeC4ModelDump = {
  elements: {
    [kind: string]: object
  }
  deployments: {
    elements: {
      [kind: string]: object
    }
  }
  views: {
    [kind: string]: object
  }
}

export interface AnyLikeC4Model<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string,
  T = 'computed' | 'layouted'
> extends Omit<ParsedLikeC4Model<string, string, string, Fqns, Views, DeploymentFqns>, 'views'> {
  __?: T
  views: Record<Views, ComputedView | DiagramView>
}

/**
 * Same as `ParsedLikeC4Model` but with computed views.
 */
export interface ComputedLikeC4Model<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string
> extends Omit<AnyLikeC4Model<Fqns, DeploymentFqns, Views, 'computed'>, 'views'> {
  views: Record<Views, ComputedView>
}
type FromParsed<M> = M extends ParsedLikeC4Model<
  any,
  any,
  any,
  infer Fqns extends string,
  infer Views extends string,
  infer DeploymentFqns extends string
> ? ComputedLikeC4Model<Fqns, DeploymentFqns, Views>
  : ComputedLikeC4Model
export type ComputedLikeC4ModelFromParsed<M> = FromParsed<M>

/**
 * Same as `ParsedLikeC4Model` but with layouted views (DiagramView)
 */
export interface LayoutedLikeC4Model<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string
> extends Omit<AnyLikeC4Model<Fqns, DeploymentFqns, Views, 'layouted'>, 'views'> {
  __: 'layouted'
  views: Record<Views, DiagramView>
}
