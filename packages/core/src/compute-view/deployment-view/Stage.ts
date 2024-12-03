import { isArray, partition } from 'remeda'
import { mergeConnections } from '../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import type { NonEmptyArray } from '../../types'
import type { Connections, Elem } from './_types'
import { MutableMemory, type Patch } from './Memory'

const asArray = <T>(value: T | ReadonlyArray<T>): ReadonlyArray<T> => isArray(value) ? value : [value]

/**
 * Union of sets
 */
const union = <T>(source: Set<T>, ...others: NonEmptyArray<Set<NoInfer<T>>>): Set<T> => {
  for (const set of others) {
    if (set.size > 0) {
      source = source.union(set)
    }
  }
  return source
}

/**
 * Stage is a single step in the computation of the view
 */
export class Stage {
  // New elements
  readonly #explicits = new Set<Elem>()
  readonly #implicits = new Set<Elem>()

  // Removed elements
  readonly #excluded = new Set<Elem>()
  readonly #excludedConnections = [] as DeploymentConnectionModel[]

  #connections = [] as DeploymentConnectionModel[]

  constructor(
    public readonly previous: Stage | null = null
  ) {}

  get connections(): ReadonlyArray<DeploymentConnectionModel> {
    return this.#connections
  }

  public addExplicit(elements: Elem | ReadonlyArray<Elem>): void {
    for (const el of asArray(elements)) {
      this.#explicits.add(el)
      this.#implicits.delete(el)
    }
  }

  public addImplicit(elements: Elem | ReadonlyArray<Elem>): void {
    for (const el of asArray(elements)) {
      if (this.#explicits.has(el)) {
        continue
      }
      this.#implicits.add(el)
    }
  }

  public addConnections(connections: Connections): Connections {
    for (const c of connections) {
      this.#connections.push(c)
      this.addImplicit([c.source, c.target])
    }
    return connections
  }

  public exclude(elements: Elem | ReadonlyArray<Elem>): void {
    if (this.#explicits.size + this.#implicits.size > 0) {
      console.warn('Excluding elements from the stage with existing elements')
    }
    for (const el of asArray(elements)) {
      this.#excluded.add(el)
      this.#explicits.delete(el)
      this.#implicits.delete(el)
    }
    if (this.#connections.length > 0) {
      console.warn('Excluding elements from the stage with existing connections')
      this.#connections = this.#connections.filter(c => !this.#excluded.has(c.source) && !this.#excluded.has(c.target))
    }
  }

  public excludeConnections(connections: Connections): void {
    if (this.#connections.length > 0) {
      console.warn('Excluding connections from the stage with existing connections')
      const ids = new Set(connections.map(c => c.id))
      this.#connections = this.#connections.filter(c => !ids.has(c.id))
    }
    for (const c of connections) {
      this.#excludedConnections.push(c)
      this.#implicits.delete(c.source)
      this.#implicits.delete(c.target)
    }
  }

  public hasConnections(): boolean {
    return this.#connections.length > 0
  }

  /**
   * Returns patch to apply to the memory
   */
  public patch(): Patch {
    return (memory) => {
      let newMemory = memory.clone()

      let fromConnections = new Set<Elem>()

      if (this.#connections.length > 0) {
        // To preserve order, we split new connections into two sets
        // First are those, that outgoing from includedElements
        const [fromKnown, rest] = partition(
          this.#connections,
          c => memory.elements.has(c.source)
        )

        newMemory.connections = mergeConnections([
          ...newMemory.connections,
          ...fromKnown,
          ...rest
        ])

        fromConnections = new Set([
          // we have source in memory.includedElements
          ...fromKnown.map(c => c.target),
          ...rest.flatMap(c => [c.source, c.target])
        ])
      }

      newMemory.explicits = union(
        newMemory.explicits,
        this.#explicits
      )

      newMemory.finalElements = union(
        newMemory.finalElements,
        this.#explicits,
        fromConnections
      )

      newMemory.elements = union(
        newMemory.elements,
        this.#explicits,
        fromConnections,
        this.#implicits
      )

      if (this.#excluded.size > 0) {
        newMemory = newMemory.exclude(this.#excluded)
      }
      if (this.#excludedConnections.length > 0) {
        newMemory = newMemory.excludeConnections(this.#excludedConnections)
      }

      return newMemory
    }
  }
}
