import { hasAtLeast, intersection } from 'remeda'
import type { NonEmptyReadonlyArray } from '../types'
import { isSameHierarchy, stringHash } from '../utils'
import type { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel } from './RelationModel'
import type { AnyAux } from './types'

// export type RelationshipsIterator<M extends AnyAux> = IteratorLike<RelationshipModel<M>>

/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export class ConnectionModel<M extends AnyAux> {
  public readonly id: M['EdgeId']

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  public readonly boundary: ElementModel<M> | null

  constructor(
    public readonly source: ElementModel<M>,
    public readonly target: ElementModel<M>,
    public readonly relations: NonEmptyReadonlyArray<RelationshipModel<M>>
  ) {
    this.id = stringHash(`${source.id}:${target.id}`) as M['EdgeId']
    this.boundary = source.commonAncestor(target)
  }
}

export function findConnection<M extends AnyAux>(
  model: LikeC4Model<M>,
  source: M['ElementOrFqn'],
  target: M['ElementOrFqn']
): readonly [ConnectionModel<M>] | readonly []

export function findConnection<M extends AnyAux>(
  model: LikeC4Model<M>,
  source: M['ElementOrFqn'],
  target: M['ElementOrFqn'],
  direction: 'directed'
): readonly [ConnectionModel<M>] | readonly []

export function findConnection<M extends AnyAux>(
  model: LikeC4Model<M>,
  source: M['ElementOrFqn'],
  target: M['ElementOrFqn'],
  direction: 'both'
): readonly [ConnectionModel<M>] | readonly [ConnectionModel<M>, ConnectionModel<M>] | readonly []

export function findConnection<M extends AnyAux>(
  model: LikeC4Model<M>,
  source: M['ElementOrFqn'],
  target: M['ElementOrFqn'],
  direction: 'directed' | 'both' = 'directed'
) {
  const sourceElement = model.element(source)
  const targetElement = model.element(target)
  if (sourceElement === targetElement) {
    return []
  }
  if (isSameHierarchy(sourceElement, targetElement)) {
    return []
  }

  const directedRelations = intersection(
    [...sourceElement.outgoing()],
    [...targetElement.incoming()]
  )
  const directed = hasAtLeast(directedRelations, 1)
    ? [new ConnectionModel(sourceElement, targetElement, directedRelations)] as const
    : [] as const

  if (direction === 'directed') {
    return directed
  }

  const reverseRelations = intersection(
    [...sourceElement.incoming()],
    [...targetElement.outgoing()]
  )
  const reverse = hasAtLeast(reverseRelations, 1)
    ? [new ConnectionModel(targetElement, sourceElement, reverseRelations)] as const
    : [] as const

  return [...directed, ...reverse] as const
}
