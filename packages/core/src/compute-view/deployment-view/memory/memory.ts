import { isDeepEqual } from 'remeda'
import type { DeploymentElementModel } from '../../../model'
import { type DeploymentConnectionModel, differenceConnections } from '../../../model'
import type { AnyAux, DeploymentViewRuleGroup, Expression, NodeId } from '../../../types'
import { difference as differenceSet, nonNullable } from '../../../utils'
import { customInspectSymbol } from '../../../utils/const'
import { toArray } from '../../../utils/iterable'
import { type ComputeCtx, type StageExpression, AbstractMemory } from '../../memory'
import type { ComputedNodesGroup } from '../../utils/buildComputedNodes'
import { StageExclude } from '../stages/stage-exclude'
import { StageInclude } from '../stages/stage-include'

type Elem = DeploymentElementModel<AnyAux>

export interface Ctx extends
  ComputeCtx<
    DeploymentElementModel<AnyAux>,
    DeploymentConnectionModel<AnyAux>,
    Memory,
    StageInclude,
    StageExclude,
    Expression<AnyAux>
  > {
  MutableState: {
    elements: Set<Elem>
    explicits: Set<Elem>
    final: Set<Elem>
    connections: DeploymentConnectionModel<AnyAux>[]
    groups: ComputedNodesGroup[]
    explicitFirstSeenIn: Map<Elem, NodeId>
    lastSeenIn: Map<Elem, NodeId>
  }
}

export class Memory extends AbstractMemory<Ctx> {
  static empty(): Memory {
    return new Memory({
      elements: new Set(),
      explicits: new Set(),
      final: new Set(),
      connections: [],
      groups: [],
      explicitFirstSeenIn: new Map(),
      lastSeenIn: new Map(),
    })
  }

  constructor(
    state: Ctx['MutableState'],
    public readonly activeGroupId: NodeId | null = null,
  ) {
    super(state)
  }

  get groups(): readonly ComputedNodesGroup[] {
    return this.state.groups
  }

  get explicitFirstSeenIn(): ReadonlyMap<Elem, NodeId> {
    return this.state.explicitFirstSeenIn
  }

  get lastSeenIn(): ReadonlyMap<Elem, NodeId> {
    return this.state.lastSeenIn
  }

  enterGroup(rule: DeploymentViewRuleGroup<AnyAux>): Memory {
    const id = `@gr${this.groups.length + 1}` as NodeId
    const state = this.mutableState()
    state.groups.push({ id, parent: this.activeGroupId, viewRule: rule, elements: [] })
    return new Memory(state, id)
  }

  leaveGroup(): Memory {
    const group = nonNullable(this.groups.find(g => g.id === this.activeGroupId), 'Active group not found')
    return new Memory(this.mutableState(), group.parent)
  }

  override stageInclude(expr: StageExpression<Ctx>): StageInclude {
    return new StageInclude(this, expr)
  }
  override stageExclude(expr: StageExpression<Ctx>): StageExclude {
    return new StageExclude(this, expr)
  }

  override mutableState(): Ctx['MutableState'] {
    return ({
      elements: new Set(this.state.elements),
      explicits: new Set(this.state.explicits),
      final: new Set(this.state.final),
      connections: [...this.state.connections],
      groups: [...this.state.groups],
      explicitFirstSeenIn: new Map(this.state.explicitFirstSeenIn),
      lastSeenIn: new Map(this.state.lastSeenIn),
    })
  }

  override update(newstate: Partial<Ctx['MutableState']>): Memory {
    return new Memory({
      ...this.state,
      ...newstate,
    }, this.activeGroupId)
  }

  equals(other: unknown): boolean {
    return other instanceof Memory && this.activeGroupId === other.activeGroupId && isDeepEqual(this.state, other.state)
  }

  diff(state: Memory) {
    return {
      added: {
        elements: toArray(differenceSet(state.elements, this.elements)),
        explicits: toArray(differenceSet(state.explicits, this.explicits)),
        final: toArray(differenceSet(state.final, this.final)),
        connections: toArray(differenceConnections(state.connections, this.connections)),
      },
      removed: {
        elements: toArray(differenceSet(this.elements, state.elements)),
        explicits: toArray(differenceSet(this.explicits, state.explicits)),
        final: toArray(differenceSet(this.final, state.final)),
        connections: differenceConnections(this.connections, state.connections),
      },
    }
  }

  public override toString(): string {
    return [
      'final:',
      ...[...this.final].map(e => '  ' + e.id),
      'connections:',
      ...this.connections.map(c => '  ' + c.expression),
    ].join('\n')
  }

  [customInspectSymbol](_depth: unknown, _inspectOptions: unknown, _inspect: unknown) {
    const asString = this.toString()

    // // Trick so that node displays the name of the constructor
    // Object.defineProperty(asString, 'constructor', {
    //   value: this.constructor,
    //   enumerable: false,
    // })

    return asString
  }
}
