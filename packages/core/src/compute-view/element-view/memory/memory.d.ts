import type { ConnectionModel, ElementModel } from '../../../model';
import type { aux, ElementViewRuleGroup as ViewRuleGroup, ModelExpression, NodeId, scalar } from '../../../types';
import { Stack } from '../../../utils/mnemonist';
import { type ComputeCtx, type CtxElement, type MutableState, type StageExpression, AbstractMemory } from '../../memory';
import { NodesGroup } from './NodeGroup';
import { ActiveGroupStageExclude, StageExclude } from './stage-exclude';
import { ActiveGroupStageInclude, StageInclude } from './stage-include';
type A = aux.Any;
export interface Ctx extends ComputeCtx<ElementModel<A>, ConnectionModel<A>, Memory<Ctx>, StageInclude<Ctx>, StageExclude, ModelExpression<A>> {
    MutableState: {
        elements: Set<ElementModel<A>>;
        explicits: Set<ElementModel<A>>;
        final: Set<ElementModel<A>>;
        connections: ConnectionModel<A>[];
        groups: NodesGroup<A>[];
        explicitFirstSeenIn: Map<ElementModel<A>, scalar.NodeId>;
        /**
         * The group where element (implicit or explicit) was last seen (added or updated)
         * Exclude root group
         */
        lastSeenIn: Map<ElementModel<A>, scalar.NodeId>;
    };
}
export declare class Memory<C extends Ctx = Ctx> extends AbstractMemory<C> {
    protected state: MutableState<C>;
    readonly scope: CtxElement<C> | null;
    static empty<EC extends Ctx>(scope: ElementModel<any> | null): Memory<EC>;
    protected constructor(state: MutableState<C>, scope: CtxElement<C> | null);
    get groups(): ReadonlyArray<NodesGroup<A>>;
    get explicitFirstSeenIn(): ReadonlyMap<ElementModel<A>, scalar.NodeId>;
    get lastSeenIn(): ReadonlyMap<ElementModel<A>, scalar.NodeId>;
    stageInclude(expr: StageExpression<C>): StageInclude;
    stageExclude(expr: StageExpression<C>): StageExclude;
    mutableState(): MutableState<C>;
    update(newstate: Partial<C['MutableState']>): Memory;
}
type ActiveGroupState = Ctx['MutableState'] & {};
export interface ActiveGroupCtx extends Ctx {
    MutableState: ActiveGroupState;
}
export declare class ActiveGroupMemory extends Memory<ActiveGroupCtx> {
    protected state: ActiveGroupState;
    readonly scope: CtxElement<ActiveGroupCtx> | null;
    protected stack: Stack<NodeId>;
    static enter(memory: Memory, rule: ViewRuleGroup<any>): ActiveGroupMemory;
    protected constructor(state: ActiveGroupState, scope: CtxElement<ActiveGroupCtx> | null, stack: Stack<NodeId>);
    get activeGroupId(): NodeId;
    mutableState(): ActiveGroupState;
    update(newstate: Partial<ActiveGroupState>): ActiveGroupMemory;
    stageInclude(expr: StageExpression<Ctx>): ActiveGroupStageInclude;
    stageExclude(expr: StageExpression<Ctx>): ActiveGroupStageExclude;
    leave(): Memory;
}
export {};
