import type { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import type { Connections, Elem } from './_types'

export interface Memory {
  /**
   * All the "visible" elements, resolved from previous stages
   */
  readonly elements: ReadonlySet<Elem>
  /**
   * Resolved connections
   * May contains duplicates, need to be merged before further processing
   */
  readonly connections: Connections

  has(el: Elem): boolean
  isImplicit(el: Elem): boolean
}

export type Patch = (memory: MutableMemory) => MutableMemory

export class MutableMemory implements Memory {
  /**
   * All the "visible" elements, resolved from previous stages
   */
  elements = new Set<Elem>()

  /**
   * Explicit elements (added directly, we are visible
   */
  explicits = new Set<Elem>()
  // implicits = new Set<Elem>()

  connections = [] as DeploymentConnectionModel[]

  /**
   * Final set of elements to be included in the view
   * (excluding implicits)
   *
   * Keeps order in which elements were added
   */
  finalElements = new Set<Elem>()

  public has(el: Elem): boolean {
    return this.elements.has(el)
  }

  public isImplicit(el: Elem): boolean {
    return this.has(el) && !this.explicits.has(el)
  }

  public exclude(excluded: Set<Elem>): MutableMemory {
    const newMemory = new MutableMemory()
    newMemory.elements = this.elements.difference(excluded)
    newMemory.explicits = this.explicits.difference(excluded)
    newMemory.finalElements = this.finalElements.difference(excluded)
    newMemory.connections = this.connections.filter(c => !excluded.has(c.source) && !excluded.has(c.target))
    return newMemory
  }
}
