import type { AnyCtx, CtxConnection, CtxElement, MutableState, StageExclude, StageExpression } from './_types';
export declare abstract class AbstractStageExclude<T extends AnyCtx> implements StageExclude<T> {
    readonly memory: T['Memory'];
    readonly expression: StageExpression<T>;
    protected excluded: {
        elements: Set<CtxElement<T>>;
        connections: CtxConnection<T>[];
    };
    constructor(memory: T['Memory'], expression: StageExpression<T>);
    protected markedToMoveExplicitToImplicit: boolean;
    protected _removeElement(element: CtxElement<T>): void;
    exclude(element: CtxElement<T> | Iterable<CtxElement<T>> | false | undefined | null): this;
    protected _removeConnection(connection: CtxConnection<T>): void;
    /**
     * Excludes from the memory relationships from given connections (still connection may be included, but without given relationships)
     * @param moveExplicitToImplicit - if true, disconnected explicit elements will be moved to implicit
     * @default false
     */
    excludeConnections(connection: CtxConnection<T> | Iterable<CtxConnection<T>>, moveExplicitToImplicit?: boolean): this;
    isDirty(): boolean;
    isEmpty(): boolean;
    /**
     * Determines whether disconnected explicits should become implicits.
     * By default moves all disconnected explicits to implicits, if there were operation to exclude elements.
     *
     * Override this method to change the behavior.
     */
    protected filterForMoveToImplicits(disconnectedExplicits: Set<CtxElement<T>>): Set<CtxElement<T>>;
    protected moveDisconnectedExplicitsToImplicits(state: MutableState<T>): MutableState<T>;
    protected removeElements(state: MutableState<T>): MutableState<T>;
    protected removeConnections(state: MutableState<T>): MutableState<T>;
    /**
     * Precommit hook
     */
    protected precommit(state: MutableState<T>): MutableState<T>;
    /**
     * Postcommit hook
     */
    protected postcommit(state: MutableState<T>): MutableState<T>;
    commit(): T['Memory'];
}
