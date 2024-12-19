import { filter, forEach, map, pipe, take, zip } from 'remeda'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import { isIterable } from '../../../utils'
import { toArray } from '../../../utils/iterable'
import { AbstractStageInclude } from '../../memory'
import { cleanCrossBoundary, cleanRedundantRelationships } from '../clean-connections'
import { type Ctx } from '../memory/memory'

type Elem = Ctx['Element']
type Connection = Ctx['Connection']

export class StageInclude extends AbstractStageInclude<Ctx> {
  /**
   * Connects elements with existing ones in the memory
   */
  public override connectWithExisting(
    elements: Elem | Iterable<Elem>,
    direction: 'in' | 'out' | 'both' = 'both',
  ): boolean {
    const before = this._connections.length
    const hasChanged = () => this._connections.length > before
    if (!isIterable(elements)) {
      if (direction === 'in') {
        for (const el of this.memory.elements) {
          this.addConnections(
            findConnection(el, elements, 'directed'),
          )
        }
        return hasChanged()
      }
      const dir = direction === 'out' ? 'directed' : 'both'
      this.addConnections(
        findConnectionsBetween(elements, this.memory.elements, dir),
      )
      return hasChanged()
    }
    const targets = [...elements]
    if (direction === 'in') {
      for (const el of this.memory.elements) {
        this.addConnections(
          findConnectionsBetween(el, targets, 'directed'),
        )
      }
    } else {
      const dir = direction === 'out' ? 'directed' : 'both'
      for (const el of targets) {
        this.addConnections(
          findConnectionsBetween(el, this.memory.elements, dir),
        )
      }
    }
    return hasChanged()
  }

  protected override processConnections(connections: Connection[]) {
    const boundaries = new Set<Elem>()
    const clean = pipe(
      connections,
      cleanCrossBoundary,
      cleanRedundantRelationships,
      map(c => {
        c.boundary && boundaries.add(c.boundary)
        return c
      }),
    )

    pipe(
      clean,
      // Process only connection from this stage
      filter(c => this._connections.some(c2 => c2.id === c.id)),
      forEach(c => {
        pipe(
          zip(
            [...toArray(c.source.ancestors()).reverse(), c.source],
            [...toArray(c.target.ancestors()).reverse(), c.target],
          ),
          filter(([source, target]) => source !== target),
          forEach(([source, target]) => {
            if (source === c.source && target === c.target) {
              // if (!c.boundary) {
              //   return
              // }
              // const maxlevel = Math.max(hierarchyLevel(source.id), hierarchyLevel(target.id))
              // // Add boundary only nodes are deeper in hierarchy
              // if (maxlevel > min || boundaries.size > 1) {
              this.addImplicit(c.boundary)
              // }
              return
            }
            if (source !== c.source && source.isDeploymentNode() && !source.onlyOneInstance()) {
              // state.final.add(source)
              this.addImplicit(source)
            }
            if (target !== c.target && target.isDeploymentNode() && !target.onlyOneInstance()) {
              // state.final.add(source)
              this.addImplicit(target)
            }
          }),
          take(1),
        )
      }),
    )
    return clean
  }
}
