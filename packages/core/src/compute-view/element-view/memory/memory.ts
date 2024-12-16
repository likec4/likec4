import Stack from 'mnemonist/stack'
import { omit } from 'remeda'
import { invariant, nonNullable } from '../../../errors'
import type { ConnectionModel } from '../../../model/connection'
import type { ElementModel } from '../../../model/ElementModel'
import type { NodeId, ViewRuleGroup } from '../../../types'
import { AbstractMemory, type ComputeCtx } from '../../memory'
import { NodesGroup } from './NodeGroup'
import { ActiveGroupStageExclude, StageExclude } from './stage-exclude'
import { ActiveGroupStageInclude, StageInclude } from './stage-include'

export interface Ctx extends
  ComputeCtx<
    ElementModel,
    ConnectionModel,
    Memory<Ctx>,
    StageInclude<Ctx>,
    StageExclude
  >
{
  MutableState: {
    elements: Set<ElementModel>
    explicits: Set<ElementModel>
    final: Set<ElementModel>
    connections: ConnectionModel[]
    groups: NodesGroup[]
    rootGroup: NodesGroup
  }
}

export class Memory<C extends Ctx = Ctx> extends AbstractMemory<C> {
  static empty(): Memory {
    return new Memory({
      elements: new Set(),
      explicits: new Set(),
      final: new Set(),
      connections: [],
      groups: [],
      rootGroup: NodesGroup.root()
    })
  }

  protected constructor(
    protected override state: C['MutableState']
  ) {
    super(state)
  }

  public get groups(): ReadonlyArray<NodesGroup> {
    return this.state.groups
  }

  public get rootGroup(): NodesGroup {
    return this.state.rootGroup
  }

  override stageInclude(): StageInclude<C> {
    return new StageInclude(this)
  }
  override stageExclude(): StageExclude {
    return new StageExclude(this)
  }

  override mutableState(): C['MutableState'] {
    return ({
      elements: new Set(this.state.elements),
      explicits: new Set(this.state.explicits),
      final: new Set(this.state.final),
      connections: [...this.state.connections],
      groups: this.state.groups.map((g) => g.clone()),
      rootGroup: this.state.rootGroup.clone()
    })
  }

  override update(newstate: Partial<C['MutableState']>): Memory {
    return new Memory({
      ...this.state,
      ...newstate
    })
  }
}

type ActiveGroupState = Ctx['MutableState'] & {
  activeGroup: NodesGroup
}

export interface ActiveGroupCtx extends Ctx {
  MutableState: ActiveGroupState
}

export class ActiveGroupMemory extends Memory<ActiveGroupCtx> {
  static enter(
    memory: Memory,
    rule: ViewRuleGroup
  ): ActiveGroupMemory {
    const groupId = `@gr${memory.groups.length + 1}` as NodeId
    if (memory instanceof ActiveGroupMemory) {
      const stack = Stack.from(memory.stack)
      const state = memory.mutableState()
      state.activeGroup = new NodesGroup(groupId, rule, state.activeGroup.id)
      state.groups.push(state.activeGroup)
      stack.push(groupId)
      return new ActiveGroupMemory(state, stack)
    }
    const state = memory.mutableState() as ActiveGroupState
    state.activeGroup = new NodesGroup(groupId, rule, null)
    state.groups.push(state.activeGroup)
    const stack = Stack.of(groupId)
    return new ActiveGroupMemory(state, stack)
  }

  protected constructor(
    protected override state: ActiveGroupState,
    // Stack of group ids
    protected stack: Stack<NodeId>
  ) {
    super(state)
  }

  get activeGroup(): NodesGroup {
    return this.state.activeGroup
  }

  override mutableState(): ActiveGroupState {
    const state = super.mutableState()
    return ({
      ...state,
      activeGroup: this.findActiveGroup(state.groups)
    })
  }

  private findActiveGroup(groups: NodesGroup[]): NodesGroup {
    return nonNullable(groups.find(g => g.id === this.activeGroup.id), 'Active group not found in groups')
  }

  override update(newstate: Partial<ActiveGroupState>): ActiveGroupMemory {
    const nextstate = {
      ...this.state,
      ...newstate
    }
    const activeGroup = this.findActiveGroup(nextstate.groups)
    invariant(Object.is(activeGroup, nextstate.activeGroup), 'Active group must strictly equal to the group in groups')
    return new ActiveGroupMemory(nextstate, this.stack)
  }

  override stageInclude(): ActiveGroupStageInclude {
    return new ActiveGroupStageInclude(this)
  }
  override stageExclude(): ActiveGroupStageExclude {
    return new ActiveGroupStageExclude(this)
  }

  public leave(): Memory {
    const state = this.mutableState()
    this.stack.pop()
    const prevgroup = this.stack.peek()
    if (prevgroup) {
      state.activeGroup = nonNullable(state.groups.find(g => g.id === prevgroup), 'Group not found in stack')
      return new ActiveGroupMemory(state, this.stack)
    }
    return new Memory(omit(state, ['activeGroup']))
  }
}
