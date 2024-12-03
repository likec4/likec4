import type { DeploymentConnectionModel } from '../../model/connection/DeploymentConnectionModel'
import { difference } from '../../utils/set'
import type { Connections, Elem } from './_types'

export interface Memory {
  /**
   * All resolved elements, includes:
   * - explicit elements (added directly, always appear in the view unless excluded)
   * - elements from resolved connections (may be excluded, if connection is redundant {@see excludeRedundantRelationships}
   * - implicit elements (not added directly, not included in the view, used for resolving connections)
   */
  readonly elements: ReadonlySet<Elem>
  /**
   * Resolved connections
   * May contains duplicates, need to be merged before further processing
   */
  readonly connections: Connections

  has(el: Elem): boolean

  isExplicit(el: Elem): boolean

  clone(): MutableMemory
}

export type Patch = (memory: Memory) => Memory

export class MutableMemory implements Memory {
  static empty(): Memory {
    return new MutableMemory(new Set(), new Set(), [], new Set())
  }
  constructor(
    public elements: Set<Elem>,
    public explicits: Set<Elem>,
    public connections: DeploymentConnectionModel[],
    /**
     * Final set of elements to be included in the view
     * (`elements` excluding implicits)
     * Keeps order in which elements were added
     */
    public finalElements: Set<Elem>
  ) {
  }

  public has(el: Elem): boolean {
    return this.elements.has(el)
  }

  public isExplicit(el: Elem): boolean {
    return this.explicits.has(el)
  }

  public exclude(excluded: Set<Elem>): MutableMemory {
    const newMemory = this.clone()
    newMemory.elements = difference(this.elements, excluded)
    newMemory.explicits = difference(this.explicits, excluded)
    newMemory.finalElements = difference(this.finalElements, excluded)
    newMemory.connections = this.connections.filter(c => !excluded.has(c.source) && !excluded.has(c.target))
    return newMemory
  }

  public excludeConnections(excluded: Connections): MutableMemory {
    if (excluded.length === 0) {
      return this
    }
    const newMemory = this.clone()

    const excludedMap = new Map(excluded.map(c => [c.id, c]))
    let minusElements = new Set<Elem>()

    newMemory.connections = this.connections.reduce((acc, c) => {
      const excluded = excludedMap.get(c.id)
      if (excluded) {
        const diff = c.difference(excluded)
        if (diff.relations.nonEmpty) {
          acc.push(diff)
        } else {
          minusElements.add(c.source)
          minusElements.add(c.target)
        }
      } else {
        acc.push(c)
      }
      return acc
    }, [] as DeploymentConnectionModel[])

    minusElements = difference(minusElements, newMemory.explicits)
    if (minusElements.size > 0) {
      for (const stillExists of newMemory.connections) {
        minusElements.delete(stillExists.source)
        minusElements.delete(stillExists.target)
      }
    }
    if (minusElements.size > 0) {
      newMemory.elements = difference(newMemory.elements, minusElements)
      newMemory.finalElements = difference(newMemory.finalElements, minusElements)
    }
    return newMemory
  }

  public clone(): MutableMemory {
    return new MutableMemory(
      new Set(this.elements),
      new Set(this.explicits),
      [...this.connections],
      new Set(this.finalElements)
    )
  }
}
