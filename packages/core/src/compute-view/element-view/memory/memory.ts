import { nonNullable } from '../../../errors'
import type { ConnectionModel, ElementModel } from '../../../model'
import type { aux, ElementViewRuleGroup as ViewRuleGroup, ModelExpression, NodeId, scalar } from '../../../types'
import { Stack } from '../../../utils/mnemonist'
import { type ComputeCtx, type CtxElement, type MutableState, type StageExpression, AbstractMemory } from '../../memory'
import { NodesGroup } from './NodeGroup'
import { ActiveGroupStageExclude, StageExclude } from './stage-exclude'
import { ActiveGroupStageInclude, StageInclude } from './stage-include'

type A = aux.Any

export interface Ctx extends
  ComputeCtx<
    ElementModel<A>,
    ConnectionModel<A>,
    Memory<Ctx>,
    StageInclude<Ctx>,
    StageExclude,
    ModelExpression<A>
  >
{
  MutableState: {
    elements: Set<ElementModel<A>>
    explicits: Set<ElementModel<A>>
    final: Set<ElementModel<A>>
    connections: ConnectionModel<A>[]
    groups: NodesGroup<A>[]
    /*
     * The group where explict element was added first time
     * May be a root group
     */
    explicitFirstSeenIn: Map<ElementModel<A>, scalar.NodeId>
    /**
     * The group where element (implicit or explicit) was last seen (added or updated)
     * Exclude root group
     */
    lastSeenIn: Map<ElementModel<A>, scalar.NodeId>
  }
}

export class Memory<C extends Ctx = Ctx> extends AbstractMemory<C> {
  static empty<EC extends Ctx>(scope: ElementModel<any> | null): Memory<EC> {
    return new Memory({
      elements: new Set(),
      explicits: new Set(),
      final: new Set(),
      connections: [],
      groups: [],
      explicitFirstSeenIn: new Map(),
      lastSeenIn: new Map(),
    }, scope)
  }

  protected constructor(
    protected override state: MutableState<C>,
    public readonly scope: CtxElement<C> | null,
  ) {
    super(state)
  }

  public get groups(): ReadonlyArray<NodesGroup<A>> {
    return this.state.groups
  }

  public get explicitFirstSeenIn(): ReadonlyMap<ElementModel<A>, scalar.NodeId> {
    return this.state.explicitFirstSeenIn
  }

  public get lastSeenIn(): ReadonlyMap<ElementModel<A>, scalar.NodeId> {
    return this.state.lastSeenIn
  }

  override stageInclude(expr: StageExpression<C>): StageInclude {
    return new StageInclude(this, expr)
  }
  override stageExclude(expr: StageExpression<C>): StageExclude {
    return new StageExclude(this, expr)
  }

  override mutableState(): MutableState<C> {
    return ({
      elements: new Set(this.state.elements),
      explicits: new Set(this.state.explicits),
      final: new Set(this.state.final),
      connections: [...this.state.connections],
      groups: this.state.groups.map((g) => g.clone()),
      explicitFirstSeenIn: new Map(this.state.explicitFirstSeenIn),
      lastSeenIn: new Map(this.state.lastSeenIn),
    })
  }

  override update(newstate: Partial<C['MutableState']>): Memory {
    return new Memory({
      ...this.state,
      ...newstate,
    }, this.scope)
  }
}

type ActiveGroupState = Ctx['MutableState'] & {
  // activeGroup: NodesGroup
}

export interface ActiveGroupCtx extends Ctx {
  MutableState: ActiveGroupState
}

export class ActiveGroupMemory extends Memory<ActiveGroupCtx> {
  static enter(
    memory: Memory,
    rule: ViewRuleGroup,
  ): ActiveGroupMemory {
    const groupId = `@gr${memory.groups.length + 1}` as NodeId
    if (memory instanceof ActiveGroupMemory) {
      const stack = Stack.from([...memory.stack].reverse())
      const state = memory.mutableState()
      state.groups.push(new NodesGroup(groupId, rule, memory.activeGroupId))
      stack.push(groupId)
      return new ActiveGroupMemory(state, memory.scope, stack)
    }
    const state = memory.mutableState() as ActiveGroupState
    state.groups.push(new NodesGroup(groupId, rule, null))
    const stack = Stack.of(groupId)
    return new ActiveGroupMemory(state, memory.scope, stack)
  }

  protected constructor(
    protected override state: ActiveGroupState,
    public override readonly scope: CtxElement<ActiveGroupCtx> | null,
    // Stack of group ids
    protected stack: Stack<NodeId>,
  ) {
    super(state, scope)
  }

  get activeGroupId(): NodeId {
    return nonNullable(this.stack.peek(), 'Stack must not be empty')
  }

  override mutableState(): ActiveGroupState {
    const state = super.mutableState()
    return ({
      ...state,
      // activeGroup: this.findActiveGroup(state.groups)
    })
  }

  // private findActiveGroup(groups: NodesGroup[]): NodesGroup {
  //   return nonNullable(groups.find(g => g.id === this.activeGroup.id), 'Active group not found in groups')
  // }

  override update(newstate: Partial<ActiveGroupState>): ActiveGroupMemory {
    const nextstate = {
      ...this.state,
      ...newstate,
    }
    // const activeGroup = this.findActiveGroup(nextstate.groups)
    // invariant(Object.is(activeGroup, nextstate.activeGroup), 'Active group must strictly equal to the group in groups')
    return new ActiveGroupMemory(nextstate, this.scope, this.stack)
  }

  override stageInclude(expr: StageExpression<Ctx>): ActiveGroupStageInclude {
    return new ActiveGroupStageInclude(this, expr)
  }
  override stageExclude(expr: StageExpression<Ctx>): ActiveGroupStageExclude {
    return new ActiveGroupStageExclude(this, expr)
  }

  public leave(): Memory {
    const state = this.mutableState()
    this.stack.pop()
    const prevgroup = this.stack.peek()
    if (prevgroup) {
      return new ActiveGroupMemory(state, this.scope, this.stack)
    }
    return new Memory(state, this.scope)
  }
}
