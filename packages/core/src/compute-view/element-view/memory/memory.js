import { nonNullable } from '../../../utils';
import { Stack } from '../../../utils/mnemonist';
import { AbstractMemory } from '../../memory';
import { NodesGroup } from './NodeGroup';
import { ActiveGroupStageExclude, StageExclude } from './stage-exclude';
import { ActiveGroupStageInclude, StageInclude } from './stage-include';
export class Memory extends AbstractMemory {
    state;
    scope;
    static empty(scope) {
        return new Memory({
            elements: new Set(),
            explicits: new Set(),
            final: new Set(),
            connections: [],
            groups: [],
            explicitFirstSeenIn: new Map(),
            lastSeenIn: new Map(),
        }, scope);
    }
    constructor(state, scope) {
        super(state);
        this.state = state;
        this.scope = scope;
    }
    get groups() {
        return this.state.groups;
    }
    get explicitFirstSeenIn() {
        return this.state.explicitFirstSeenIn;
    }
    get lastSeenIn() {
        return this.state.lastSeenIn;
    }
    stageInclude(expr) {
        return new StageInclude(this, expr);
    }
    stageExclude(expr) {
        return new StageExclude(this, expr);
    }
    mutableState() {
        return ({
            elements: new Set(this.state.elements),
            explicits: new Set(this.state.explicits),
            final: new Set(this.state.final),
            connections: [...this.state.connections],
            groups: this.state.groups.map((g) => g.clone()),
            explicitFirstSeenIn: new Map(this.state.explicitFirstSeenIn),
            lastSeenIn: new Map(this.state.lastSeenIn),
        });
    }
    update(newstate) {
        return new Memory({
            ...this.state,
            ...newstate,
        }, this.scope);
    }
}
export class ActiveGroupMemory extends Memory {
    state;
    scope;
    stack;
    static enter(memory, rule) {
        const groupId = `@gr${memory.groups.length + 1}`;
        if (memory instanceof ActiveGroupMemory) {
            const stack = Stack.from([...memory.stack].reverse());
            const state = memory.mutableState();
            state.groups.push(new NodesGroup(groupId, rule, memory.activeGroupId));
            stack.push(groupId);
            return new ActiveGroupMemory(state, memory.scope, stack);
        }
        const state = memory.mutableState();
        state.groups.push(new NodesGroup(groupId, rule, null));
        const stack = Stack.of(groupId);
        return new ActiveGroupMemory(state, memory.scope, stack);
    }
    constructor(state, scope, 
    // Stack of group ids
    stack) {
        super(state, scope);
        this.state = state;
        this.scope = scope;
        this.stack = stack;
    }
    get activeGroupId() {
        return nonNullable(this.stack.peek(), 'Stack must not be empty');
    }
    mutableState() {
        const state = super.mutableState();
        return ({
            ...state,
            // activeGroup: this.findActiveGroup(state.groups)
        });
    }
    // private findActiveGroup(groups: NodesGroup[]): NodesGroup {
    //   return nonNullable(groups.find(g => g.id === this.activeGroup.id), 'Active group not found in groups')
    // }
    update(newstate) {
        const nextstate = {
            ...this.state,
            ...newstate,
        };
        // const activeGroup = this.findActiveGroup(nextstate.groups)
        // invariant(Object.is(activeGroup, nextstate.activeGroup), 'Active group must strictly equal to the group in groups')
        return new ActiveGroupMemory(nextstate, this.scope, this.stack);
    }
    stageInclude(expr) {
        return new ActiveGroupStageInclude(this, expr);
    }
    stageExclude(expr) {
        return new ActiveGroupStageExclude(this, expr);
    }
    leave() {
        const state = this.mutableState();
        this.stack.pop();
        const prevgroup = this.stack.peek();
        if (prevgroup) {
            return new ActiveGroupMemory(state, this.scope, this.stack);
        }
        return new Memory(state, this.scope);
    }
}
