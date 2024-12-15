import { identity, isArray, partition } from 'remeda'
import type { Connection } from '../model/connection/model'
import { mergeConnections } from '../model/connection/model'
import { isIterable } from '../utils'
import { union } from '../utils/set'
import type { Memory, Patch } from './Memory'

type Connections<C> = ReadonlyArray<C>

type WithId = { readonly id: string }

/**
 * Stage is a single step in the computation of the view
 */
export class Stage<Elem extends WithId, C extends Connection<Elem, any>> {
  // New elements
  protected readonly explicits = new Set<Elem>()
  protected readonly implicits = new Set<Elem>()

  // Removed elements
  protected readonly excluded = new Set<Elem>()
  protected readonly excludedConnections = [] as C[]

  protected _connections = [] as C[]

  constructor(
    public readonly previous: Stage<Elem, C> | null = null
  ) {}

  get connections(): ReadonlyArray<C> {
    return this._connections
  }

  hasChanges(): boolean {
    return false
      || this.explicits.size > 0
      || this.implicits.size > 0
      || this.excluded.size > 0
      || this.excludedConnections.length > 0
      || this._connections.length > 0
  }

  private _addExplicit(elements: Elem): void {
    this.explicits.add(elements)
    this.implicits.delete(elements)
  }
  public addExplicit(elements: Elem | Iterable<Elem> | false | undefined | null): void {
    if (!elements) {
      return
    }
    if (isIterable(elements)) {
      for (const el of elements) {
        this._addExplicit(el)
      }
      return
    }
    this._addExplicit(elements)
  }

  private _addImplicit(elements: Elem): void {
    if (this.explicits.has(elements)) {
      return
    }
    this.implicits.add(elements)
  }
  public addImplicit(elements: Elem | Iterable<Elem> | false | undefined | null): void {
    if (!elements) {
      return
    }
    if (isIterable(elements)) {
      for (const el of elements) {
        this._addImplicit(el)
      }
      return
    }
    this._addImplicit(elements)
  }

  public addConnections(connections: Connections<C>): Connections<C> {
    for (const c of connections) {
      this._connections.push(c)
      this.addImplicit([c.source, c.target])
    }
    return connections
  }

  private _exclude(el: Elem): this {
    this.excluded.add(el)
    this.explicits.delete(el)
    this.implicits.delete(el)
    return this
  }
  public exclude(elements: Elem | Iterable<Elem> | false | undefined | null): this {
    if (!elements) {
      return this
    }
    if (isIterable(elements)) {
      for (const el of elements) {
        this._exclude(el)
      }
      return this
    }
    return this._exclude(elements)
  }

  public excludeConnections(connections: Connections<C>): this {
    if (this.connections.length > 0) {
      console.warn('Excluding connections from the stage with existing connections')
    }
    for (const c of connections) {
      this.excludedConnections.push(c)
    }
    return this
  }

  public hasConnections(): boolean {
    return this.connections.length > 0
  }

  /**
   * Returns patch to apply to the memory
   */
  public patch(): Patch<Memory<Elem, C>> {
    if (!this.hasChanges()) {
      return identity()
    }
    return (memory) => {
      let newMemory = memory.clone()

      let fromConnections = new Set<Elem>()

      if (this.connections.length > 0) {
        // To preserve order, we split new connections into two sets
        // First are outgoing from known elements (in memory.elements)
        const [fromKnown, rest] = partition(
          this.connections,
          c => newMemory.finalElements.has(c.source)
        )

        newMemory.connections = mergeConnections([
          ...memory.connections,
          ...fromKnown,
          ...rest
        ])

        fromConnections = new Set([
          // we have source in memory.elements
          ...fromKnown.map(c => c.target),
          ...rest.flatMap(c => [c.source, c.target])
        ])
      }

      if (this.explicits.size > 0 || fromConnections.size > 0 || this.implicits.size > 0) {
        newMemory.explicits = union(
          newMemory.explicits,
          this.explicits
        )

        newMemory.finalElements = union(
          newMemory.finalElements,
          this.explicits,
          fromConnections
        )

        newMemory.elements = union(
          newMemory.elements,
          this.explicits,
          fromConnections,
          this.implicits
        )
      }

      if (this.excluded.size > 0) {
        newMemory = newMemory.exclude(this.excluded)
      }
      if (this.excludedConnections.length > 0) {
        newMemory = newMemory.excludeConnections(this.excludedConnections)
      }

      return newMemory
    }
  }
}
