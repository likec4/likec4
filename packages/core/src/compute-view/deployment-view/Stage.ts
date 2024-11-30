import { isArray, partition } from 'remeda'
import { mergeConnections } from '../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import type { Connections, Elem } from './_types'
import { MutableMemory, type Patch } from './Memory'

const asArray = <T>(value: T | ReadonlyArray<T>): ReadonlyArray<T> => isArray(value) ? value : [value]

/**
 * Stage is a single step in the computation of the view
 */
export class Stage {
  // New elements
  readonly #explicits = new Set<Elem>()
  readonly #implicits = new Set<Elem>()

  // Removed elements
  readonly #excluded = new Set<Elem>()

  #connections = [] as DeploymentConnectionModel[]

  constructor(
    public readonly previous: Stage | null = null
  ) {}

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
    const toExclude = asArray(elements)
    for (const el of toExclude) {
      this.#excluded.add(el)
      this.#explicits.delete(el)
      this.#implicits.delete
    }
    this.#connections = this.#connections.filter(c => !toExclude.includes(c.source) && !toExclude.includes(c.target))
  }

  public hasConnections(): boolean {
    return this.#connections.length > 0
  }

  /**
   * Returns patch to apply to the memory
   */
  public patch(): Patch {
    return (memory) => {
      if (this.#excluded.size > 0) {
        memory = memory.exclude(this.#excluded)
      }
      const newMemory = new MutableMemory()

      newMemory.explicits = memory.explicits
        .union(this.#explicits)

      // To preserve order, we split new connections into two sets
      // First are those, that outgoing from includedElements
      const [fromKnown, rest] = partition(
        this.#connections,
        c => memory.finalElements.has(c.source)
      )

      newMemory.connections = mergeConnections([
        ...memory.connections,
        ...fromKnown,
        ...rest
      ])

      newMemory.finalElements = memory.finalElements
        .union(this.#explicits)
        .union(
          new Set([
            // we have source in memory.includedElements
            ...fromKnown.map(c => c.target),
            ...rest.flatMap(c => [c.source, c.target])
          ])
        )

      newMemory.elements = memory.elements
        .union(newMemory.finalElements)
        .union(this.#implicits)

      return newMemory
    }
  }
}
