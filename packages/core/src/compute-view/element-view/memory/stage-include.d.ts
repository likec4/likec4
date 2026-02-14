import { dropWhile } from 'remeda';
import { type CtxConnection, type StageExpression, AbstractStageInclude } from '../../memory';
import type { ActiveGroupCtx, ActiveGroupMemory, Ctx } from './memory';
export type Elem = Ctx['Element'];
export declare class StageInclude<C extends Ctx = Ctx> extends AbstractStageInclude<C> {
    /**
     * Connects elements with existing ones in the memory
     */
    connectWithExisting(elements: Elem | Iterable<Elem>, direction?: 'in' | 'out' | 'both'): boolean;
    protected addImplicitWithinScope(element: Elem | undefined | null): void;
    protected processConnections(connections: CtxConnection<Ctx>[]): CtxConnection<Ctx>[];
    protected postcommit(state: ActiveGroupCtx['MutableState']): {
        elements: Set<dropWhile<aux.Any>>;
        explicits: Set<dropWhile<aux.Any>>;
        final: Set<dropWhile<aux.Any>>;
        connections: dropWhile<aux.Any>[];
        groups: import("./NodeGroup").NodesGroup<aux.Any>[];
        explicitFirstSeenIn: Map<dropWhile<aux.Any>, dropWhile>;
        lastSeenIn: Map<dropWhile<aux.Any>, dropWhile>;
    };
}
export declare class ActiveGroupStageInclude extends StageInclude<ActiveGroupCtx> {
    readonly memory: ActiveGroupMemory;
    readonly expression: StageExpression<ActiveGroupCtx>;
    constructor(memory: ActiveGroupMemory, expression: StageExpression<ActiveGroupCtx>);
    protected postcommit(state: ActiveGroupCtx['MutableState']): {
        elements: Set<dropWhile<aux.Any>>;
        explicits: Set<dropWhile<aux.Any>>;
        final: Set<dropWhile<aux.Any>>;
        connections: dropWhile<aux.Any>[];
        groups: import("./NodeGroup").NodesGroup<aux.Any>[];
        explicitFirstSeenIn: Map<dropWhile<aux.Any>, dropWhile>;
        lastSeenIn: Map<dropWhile<aux.Any>, dropWhile>;
    };
}
