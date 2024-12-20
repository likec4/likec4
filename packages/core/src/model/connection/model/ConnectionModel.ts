import { invariant } from '../../../errors'
import { customInspectSymbol } from '../../../utils/const'
import { ifilter, isome } from '../../../utils/iterable'
import { difference, equals, intersection, union } from '../../../utils/set'
import { stringHash } from '../../../utils/string-hash'
import type { ElementModel } from '../../ElementModel'
import type { RelationshipModel } from '../../RelationModel'
import type { AnyAux } from '../../types'
import type { Connection } from '../Connection'
import { hasSameSourceTarget } from '../ops'
import { findConnection } from './find'

/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export class ConnectionModel<M extends AnyAux = AnyAux> implements Connection<ElementModel<M>, M['EdgeId']> {
  public readonly id: M['EdgeId']

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  public readonly boundary: ElementModel<M> | null

  public readonly directRelations: ReadonlySet<RelationshipModel<M>>

  constructor(
    public readonly source: ElementModel<M>,
    public readonly target: ElementModel<M>,
    public readonly relations: ReadonlySet<RelationshipModel<M>> = new Set(),
  ) {
    this.id = stringHash(`model:${source.id}:${target.id}`) as M['EdgeId']
    this.boundary = source.commonAncestor(target)
    this.directRelations = new Set(ifilter(relations, hasSameSourceTarget(this)))
  }

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  get expression(): string {
    return `${this.source.id} -> ${this.target.id}`
  }

  nonEmpty(): boolean {
    return this.relations.size > 0
  }

  mergeWith(other: ConnectionModel<M>) {
    invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources')
    invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets')
    return new ConnectionModel(
      this.source,
      this.target,
      union(this.relations, other.relations),
    )
  }

  difference(other: ConnectionModel<M>) {
    return new ConnectionModel(
      this.source,
      this.target,
      difference(this.relations, other.relations),
    )
  }

  intersect(other: ConnectionModel<M>) {
    invariant(other instanceof ConnectionModel, 'Cannot intersect connection with different type')
    return new ConnectionModel(
      this.source,
      this.target,
      intersection(this.relations, other.relations),
    )
  }

  equals(other: Connection): boolean {
    invariant(other instanceof ConnectionModel, 'Cannot merge connection with different type')
    return this.id === other.id
      && this.source.id === other.source.id
      && this.target.id === other.target.id
      && equals(this.relations, other.relations)
  }

  /**
   * Returns a new instance with the updated relations.
   *
   * @param relations - A readonly set of `RelationshipModel` instances representing the new relations.
   * @returns A new `ConnectionModel` instance with the updated relations.
   */
  update(relations: ReadonlySet<RelationshipModel<M>>): ConnectionModel<M> {
    return new ConnectionModel(
      this.source,
      this.target,
      relations,
    )
  }

  [customInspectSymbol](
    // @ts-ignore
    depth,
    // @ts-ignore
    inspectOptions,
    // @ts-ignore
    inspect,
  ) {
    const asString = this.toString()

    // Trick so that node displays the name of the constructor
    Object.defineProperty(asString, 'constructor', {
      value: ConnectionModel,
      enumerable: false,
    })

    return asString
  }

  toString() {
    return [
      this.expression,
      this.relations.size ? '  relations:' : '  relations: [ ]',
      ...[...this.relations].map(c => '    ' + c.expression),
    ].join('\n')
  }

  /**
   * Creates a new connection with reversed direction (target becomes source and vice versa)
   * @param search - When true, attempts to find an existing connection between the reversed nodes
   */
  reversed(search = false): ConnectionModel<M> {
    if (!search) {
      return new ConnectionModel(this.target, this.source)
    }
    const [found] = findConnection(this.target, this.source, 'directed')
    return found ?? new ConnectionModel(this.target, this.source, new Set())
  }
}
