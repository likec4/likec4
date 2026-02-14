import type { AnyCtx, CtxConnection as Connection, CtxElement as Elem, GenericCtx, MutableState, StageExpression, StageInclude } from './_types';
export declare abstract class AbstractStageInclude<T extends AnyCtx = GenericCtx> implements StageInclude<T> {
    readonly memory: T['Memory'];
    readonly expression: StageExpression<T>;
    protected explicits: Set<Elem<T>>;
    protected implicits: Set<Elem<T>>;
    protected _ordered: Set<Elem<T>>;
    protected _connections: Connection<T>[];
    constructor(memory: T['Memory'], expression: StageExpression<T>);
    get elements(): ReadonlySet<Elem<T>>;
    /**
     * Connections from this stage
     */
    get connections(): readonly Connection<T>[];
    mergedConnections(): readonly Connection<T>[];
    connectWithExisting(_element: Elem<T> | Iterable<Elem<T>>, _direction?: 'in' | 'out' | 'both'): boolean;
    /**
     * Possible to override
     */
    protected _addExplicit(elements: Elem<T>): void;
    addExplicit(element: Elem<T> | Iterable<Elem<T>> | false | undefined | null): this;
    /**
     * Possible to override
     */
    protected _addImplicit(elements: Elem<T>): void;
    addImplicit(elements: Elem<T> | Iterable<Elem<T>> | false | undefined | null): this;
    /**
     * Possible to override
     */
    protected _addConnection(connection: Connection<T>): void;
    addConnections(connection: Connection<T> | Iterable<Connection<T>>): this;
    isDirty(): boolean;
    isEmpty(): boolean;
    /**
     * Precommit hook
     */
    protected precommit(state: MutableState<T>): MutableState<T>;
    /**
     * Postcommit hook
     */
    protected postcommit(state: MutableState<T>): MutableState<T>;
    protected processConnections(connections: Connection<T>[]): Connection<T>[];
    commit(): T['Memory'];
}
