import type {
  DeploymentElement,
  DeploymentNodeKind,
  DeploymentNodeKindSpecification,
  DeploymentRelation,
} from './deployments'
import type { ElementKindSpecification, Tag, TypedElement } from './element'
import type { ModelGlobals } from './global'
import type { ModelRelation, RelationId, RelationshipKindSpecification } from './relation'
import type { ComputedView, DiagramView, LikeC4View } from './view'

/**
 * Represents a LikeC4 model with customizable type parameters,
 * parsed from DSL or result from Builder
 *
 * !IMPORTANT: This is a low-level type, use `LikeC4Model` instead.
 * !NOTE: Views are not computed yet.
 *
 * @typeParam ElementKinds - Types of elements in the model (defaults to string)
 * @typeParam RelationKinds - Types of relationships (defaults to string)
 * @typeParam Tags - Types of tags that can be applied (defaults to string)
 * @typeParam Fqns - Fully Qualified Names for elements (defaults to string)
 * @typeParam Views - Types of views in the model (defaults to string)
 * @typeParam DeploymentFqns - Fully Qualified Names for deployment nodes (defaults to string)
 */
export interface ParsedLikeC4ModelData<
  ElementKinds extends string = string,
  RelationKinds extends string = string,
  Tags extends string = string,
  Fqns extends string = string,
  Views extends string = string,
  DeploymentFqns extends string = string,
> {
  // To prevent accidental use of this type
  __?: never
  specification: {
    tags: Tag<Tags>[]
    elements: Record<ElementKinds, ElementKindSpecification>
    deployments: Record<DeploymentNodeKind, DeploymentNodeKindSpecification>
    relationships: Record<RelationKinds, RelationshipKindSpecification>
  }
  elements: Record<Fqns, TypedElement<Fqns, ElementKinds, Tags>>
  relations: Record<RelationId, ModelRelation>
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

export type AnyParsedLikeC4ModelData = ParsedLikeC4ModelData<any, any, any, any, any, any>
/**
 * Hook to get types from dump
 */
export type LikeC4ModelDump = {
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

/**
 * Same as {@link ParsedLikeC4ModelData}, but with computed views or layouted views.
 */
export interface GenericLikeC4ModelData<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string,
  Tags extends string = string,
  T = 'computed' | 'layouted',
> extends Omit<ParsedLikeC4ModelData<string, string, Tags, Fqns, Views, DeploymentFqns>, 'views' | '__'> {
  __?: T
  views: Record<Views, ComputedView<Views> | DiagramView<Views>>
}

export interface ComputedLikeC4ModelData<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string,
  Tags extends string = string,
> extends Omit<GenericLikeC4ModelData<Fqns, DeploymentFqns, Views, Tags, 'computed'>, 'views'> {
  views: Record<Views, ComputedView<Views>>
}

export interface LayoutedLikeC4ModelData<
  Fqns extends string = string,
  DeploymentFqns extends string = string,
  Views extends string = string,
  Tags extends string = string,
> extends Omit<GenericLikeC4ModelData<Fqns, DeploymentFqns, Views, Tags, 'layouted'>, 'views'> {
  __: 'layouted'
  views: Record<Views, DiagramView<Views, Tags>>
}
