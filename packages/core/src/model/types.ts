import type { Tagged } from 'type-fest'
import type {
  AnyAux,
  ComputedLikeC4ModelData,
  ComputedView,
  DiagramView,
  LayoutedLikeC4ModelData,
  ParsedLikeC4ModelData,
  scalar,
  ViewType,
  ViewWithType,
} from '../types'
import type * as aux from '../types/aux'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

type AnyScalar<V extends string> =
  | Tagged<V, 'Fqn'>
  | Tagged<V, 'DeploymentFqn'>
  | Tagged<V, 'ViewId'>
  | Tagged<V, 'NodeId'>
  | Tagged<V, 'EdgeId'>
  | Tagged<V, 'RelationId'>

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string, Scalar extends AnyScalar<Id>>(element: Id | { id: Scalar }): Scalar {
  return typeof element === 'string' ? element as unknown as Scalar : element.id
}

export type ElementOrFqn<A extends AnyAux> = aux.ElementId<A> | { id: aux.Fqn<A> }

export type DeploymentOrFqn<A extends AnyAux> = aux.DeploymentId<A> | { id: aux.DeploymentFqn<A> }

export type ViewOrId<A extends AnyAux> = aux.ViewId<A> | { id: aux.StrictViewId<A> }

export type NodeOrId = string | { id: scalar.NodeId }
export type EdgeOrId = string | { id: scalar.EdgeId }
export type RelationOrId = string | { id: scalar.RelationId }

export type $View<A extends AnyAux> = {
  parsed: never
  computed: ComputedView<A>
  layouted: DiagramView<A>
}[aux.Stage<A>]

export type $ViewWithType<A extends AnyAux, V extends ViewType> = ViewWithType<$View<A>, V>

export type $ViewModel<A extends AnyAux> = {
  parsed: never
  computed: LikeC4ViewModel<A>
  layouted: LikeC4ViewModel<A>
}[aux.Stage<A>]

// export type $ModelData<A> = A extends infer T extends Any ? {
export type $ModelData<A extends AnyAux> = {
  parsed: ParsedLikeC4ModelData<A>
  computed: ComputedLikeC4ModelData<A>
  layouted: LayoutedLikeC4ModelData<A>
}[aux.Stage<A>]

export interface WithTags<A extends AnyAux> {
  get tags(): aux.Tags<A>
  isTagged(tag: aux.LooseTag<A>): boolean
}

export interface WithMetadata<A extends AnyAux> {
  getMetadata(): aux.Metadata<A>
  getMetadata(field: aux.MetadataKey<A>): string | undefined
}
