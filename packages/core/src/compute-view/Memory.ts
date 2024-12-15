import { type Connection, findAscendingConnections } from '../model/connection'
import { difference, intersection } from '../utils/set'

type Connections<C> = ReadonlyArray<C>

type WithId = { readonly id: string }

export interface Memory<Elem extends WithId, C extends Connection<Elem, any>> {
  /**
   * All resolved elements, includes:
   * - explicit elements (included by element predicates, always appear in the view unless excluded)
   * - elements from resolved connections (may be excluded, if connection is redundant @see excludeRedundantRelationships
   * - implicit elements (not added directly, not included in the view, used for resolving connections)
   */
  readonly elements: ReadonlySet<Elem>
  /**
   * Resolved connections
   * May contains duplicates, need to be merged before further processing
   */
  readonly connections: Connections<C>

  isEmpty(): boolean

  has(el: Elem): boolean

  isExplicit(el: Elem): boolean

  clone(): MutableMemory<Elem, C>
}

export type Patch<M extends Memory<any, any>> = (memory: M) => M

export class MutableMemory<Elem extends WithId, C extends Connection<Elem, any>> implements Memory<Elem, C> {
  constructor(
    public elements: Set<Elem>,
    public explicits: Set<Elem>,
    public connections: Connections<C>,
    /**
     * Final set of elements to be included in the view
     * (`elements` excluding implicits)
     * Keeps order in which elements were added
     */
    public finalElements: Set<Elem>
  ) {
  }

  public isEmpty(): boolean {
    return this.elements.size === 0
  }

  public has(el: Elem): boolean {
    return this.elements.has(el)
  }

  public isExplicit(el: Elem): boolean {
    return this.explicits.has(el)
  }

  public exclude(excluded: Set<Elem>): MutableMemory<Elem, C> {
    const newMemory = this.clone()
    newMemory.elements = difference(this.elements, excluded)
    newMemory.explicits = difference(this.explicits, excluded)
    newMemory.finalElements = difference(this.finalElements, excluded)

    const excludedConnections = this.connections
      .filter(c => excluded.has(c.source) || excluded.has(c.target))

    const ascConnections = excludedConnections.flatMap(c =>
      findAscendingConnections(this.connections, c).map(asc => asc.intersect(c) as C)
    )

    // )
    //   .flatMap(c => [
    //     c,
    //     ...findAscendingConnections(this.connections, c).map(asc => asc.intersect(c) as C)
    //   ])
    if (excludedConnections.length > 0) {
      return newMemory.excludeConnections([
        ...excludedConnections,
        ...ascConnections
      ])
    }
    return newMemory
  }

  public excludeConnections(excluded: Connections<C>): MutableMemory<Elem, C> {
    if (excluded.length === 0) {
      return this
    }
    const newMemory = this.clone()

    const excludedMap = excluded.reduce((acc, c) => {
      const existing = acc.get(c.id)
      if (existing) {
        acc.set(c.id, existing.mergeWith(c) as C)
      } else {
        acc.set(c.id, c)
      }
      return acc
    }, new Map<string, C>())

    // were connected before and not anymore
    let excludedElements = new Set<Elem>()

    newMemory.connections = newMemory.connections.reduce((acc, c) => {
      const excluded = excludedMap.get(c.id)
      if (excluded) {
        excludedElements.add(c.source)
        excludedElements.add(c.target)
        const diff = c.difference(excluded) as C
        if (diff.nonEmpty()) {
          acc.push(diff)
        }
      } else {
        acc.push(c)
      }
      return acc
    }, [] as C[])

    for (const stillExists of newMemory.connections) {
      excludedElements.delete(stillExists.source)
      excludedElements.delete(stillExists.target)
    }

    if (excludedElements.size === 0) {
      return newMemory
    }

    // Check if EXPLICIT elements are becoming IMPLICIT
    // (it means that they are not connected anymore)
    const explicitsBecomingImplicit = intersection(newMemory.explicits, excludedElements)
    if (explicitsBecomingImplicit.size > 0) {
      newMemory.explicits = difference(newMemory.explicits, explicitsBecomingImplicit)
      // Exclude from final elements
      newMemory.finalElements = difference(newMemory.finalElements, excludedElements)

      // Exclude from elements (but keep implicits)
      newMemory.elements = difference(
        newMemory.elements,
        difference(excludedElements, explicitsBecomingImplicit)
      )
      return newMemory
    }

    newMemory.elements = difference(newMemory.elements, excludedElements)
    newMemory.finalElements = difference(newMemory.finalElements, excludedElements)

    return newMemory
  }

  public clone(): MutableMemory<Elem, C> {
    return new MutableMemory(
      new Set(this.elements),
      new Set(this.explicits),
      [...this.connections],
      new Set(this.finalElements)
    )
  }
}
