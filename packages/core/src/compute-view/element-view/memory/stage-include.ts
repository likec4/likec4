import { dropWhile, forEach, pipe, take, zip } from 'remeda'
import { Expr } from '../../..'
import { findConnection, findConnectionsBetween } from '../../../model/connection/model'
import { difference, isAncestor, isIterable } from '../../../utils'
import { toArray } from '../../../utils/iterable'
import { type CtxConnection, type StageExpression, AbstractStageInclude } from '../../memory'
import { type ActiveGroupCtx, type ActiveGroupMemory, type Ctx } from './memory'

export type Elem = Ctx['Element']

export class StageInclude<C extends Ctx = Ctx> extends AbstractStageInclude<C> {
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
      if (direction === 'in' || direction === 'both') {
        for (const el of this.memory.elements) {
          this.addConnections(
            findConnection(el, elements, 'directed'),
          )
        }
      }
      if (direction === 'out' || direction === 'both') {
        this.addConnections(
          findConnectionsBetween(elements, this.memory.elements, 'directed'),
        )
      }
      return hasChanged()
    }

    const targets = [...elements]
    if (direction === 'in' || direction === 'both') {
      for (const el of this.memory.elements) {
        this.addConnections(
          findConnectionsBetween(el, targets, 'directed'),
        )
      }
    }
    if (direction === 'out' || direction === 'both') {
      for (const el of targets) {
        this.addConnections(
          findConnectionsBetween(el, this.memory.elements, 'directed'),
        )
      }
    }
    return hasChanged()
  }

  protected addImplicitWithinScope(element: Elem | undefined | null) {
    if (!element) {
      return
    }
    if (!this.memory.scope || isAncestor(this.memory.scope, element)) {
      this.addImplicit(element)
    }
  }

  protected override processConnections(connections: CtxConnection<Ctx>[]) {
    if (Expr.isRelationPredicateExpr(this.expression)) {
      return connections
    }

    pipe(
      connections,
      forEach(({ source, target, boundary }) => {
        pipe(
          zip(
            [...toArray(source.ancestors()).reverse(), source],
            [...toArray(target.ancestors()).reverse(), target],
          ),
          // Filter out common ancestors
          dropWhile(([sourceAncestor, targetAncestor]) => sourceAncestor === targetAncestor),
          take(1),
          forEach(([sourceAncestor, targetAncestor]) => {
            if (sourceAncestor === source && targetAncestor === target) {
              this.addImplicitWithinScope(boundary)
              return
            }
            if (sourceAncestor !== source) {
              this.addImplicitWithinScope(sourceAncestor)
            }
            if (targetAncestor !== target) {
              this.addImplicitWithinScope(targetAncestor)
            }
          }),
        )
      }),
    )
    return connections
  }

  protected override postcommit(state: ActiveGroupCtx['MutableState']) {
    const newExplicits = difference(state.explicits, this.memory.explicits)
    for (const explicit of newExplicits) {
      state.explicitFirstSeenIn.set(explicit, '@root' as any)
    }

    return state
  }
}

export class ActiveGroupStageInclude extends StageInclude<ActiveGroupCtx> {
  constructor(
    public override readonly memory: ActiveGroupMemory,
    public override readonly expression: StageExpression<ActiveGroupCtx>,
  ) {
    super(memory, expression)
  }

  protected override postcommit(state: ActiveGroupCtx['MutableState']) {
    const newExplicits = difference(state.explicits, this.memory.explicits)
    for (const explicit of newExplicits) {
      state.explicitFirstSeenIn.set(explicit, this.memory.activeGroupId)
    }

    for (const implicit of [...this.explicits, ...this.implicits]) {
      state.lastSeenIn.set(implicit, this.memory.activeGroupId)
    }

    return state
  }
}
