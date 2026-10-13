import type { Tagged } from 'type-fest'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { Element, Relationship } from './model-logical'
import type * as scalar from './scalar'

/**
 * Identifier of a model diff (name of the `diff` block in the DSL).
 */
export type DiffId = Tagged<string, 'DiffId'>

export function DiffId(id: string): DiffId {
  return id as DiffId
}

/**
 * Change status of a node or an edge.
 *
 * - `added`, `removed`, `modified`: compare views (model before and after a diff)
 * - `orphan`: removal impact views, element left without relationships after the removal
 */
export type DiffStatus = 'added' | 'removed' | 'modified' | 'orphan'

/**
 * Number of added, removed and modified nodes or edges of a compare view
 */
export interface DiffStatusCounts {
  added: number
  removed: number
  modified: number
}

/**
 * View changed by a diff
 */
export interface DiffViewSummary {
  id: scalar.ViewId
  title: string | null
  nodes: DiffStatusCounts
  edges: DiffStatusCounts
}

/**
 * Diff with its number of changes and the views it changes
 */
export interface DiffSummary {
  id: DiffId
  title: string | null
  description: scalar.MarkdownOrString | null
  added: { elements: number; relations: number }
  removed: { elements: number; relations: number }
  modified: { elements: number }
  views: DiffViewSummary[]
}

/**
 * Properties a diff adds to an existing element (`extend` inside the `add` block).
 */
// dprint-ignore
export interface ModelDiffElementOverlay<A extends AnyAux = AnyAux>
  extends
    aux.WithOptionalTags<A>,
    aux.WithOptionalLinks,
    aux.WithMetadata<A>
{}

/**
 * Named change set of the model (the `diff` block in the DSL).
 * Applying the diff to the model gives the "to-be" state of the model.
 */
export interface ModelDiff<A extends AnyAux = AnyAux> {
  readonly id: DiffId
  readonly title: string | null
  readonly description?: scalar.MarkdownOrString | null
  readonly remove: {
    /**
     * Removed elements.
     * Their descendants and all relationships of the removed elements are removed too.
     */
    readonly elements: ReadonlyArray<aux.StrictFqn<A>>
    /**
     * Removed relationships
     */
    readonly relations: ReadonlyArray<scalar.RelationId>
  }
  readonly add: {
    readonly elements: Readonly<Record<aux.ElementId<A>, Element<A>>>
    readonly relations: Readonly<Record<scalar.RelationId, Relationship<A>>>
  }
  readonly modify: {
    readonly elements: Readonly<Record<aux.ElementId<A>, ModelDiffElementOverlay<A>>>
  }
}
