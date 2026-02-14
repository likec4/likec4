import type { ExpectStatic } from 'vitest';
import type { AnyTypes, Builder, ElementViewRulesBuilder, Types, ViewPredicate } from '../../../builder';
import * as viewhelpers from '../../../builder/Builder.view-common';
import type { ConnectionModel, ElementModel, LikeC4Model } from '../../../model';
import { type Any, type ComputedElementView, type ComputedView, type ViewRule } from '../../../types';
import { Memory } from '../memory';
type ConnectionExpression<T extends AnyTypes> = `${T['Fqn']} -> ${T['Fqn']}`;
type ConnectionsDeepMatcher<Expr extends string> = {
    [K in Expr]?: Array<Expr>;
};
type ConnectionEqual<T extends AnyTypes> = [ConnectionsDeepMatcher<ConnectionExpression<T>>] | [
    ConnectionExpression<T>,
    ...ConnectionExpression<T>[]
];
export declare class TestHelper<T extends AnyTypes> {
    private builder;
    private _expect;
    model: LikeC4Model.Computed<Types.ToAux<T>>;
    Aux: typeof this.model.Aux;
    Elem: ElementModel<typeof this.Aux>;
    Connection: ConnectionModel<typeof this.Aux>;
    CompView: ComputedElementView<typeof this.Aux>;
    static $include: typeof viewhelpers.$include;
    static $exclude: typeof viewhelpers.$exclude;
    static $rules: typeof viewhelpers.$rules;
    static $style: typeof viewhelpers.$style;
    $include: typeof viewhelpers.$include;
    $exclude: typeof viewhelpers.$exclude;
    $style: typeof viewhelpers.$style;
    static from<const T extends AnyTypes>(builder: Builder<T>, expect?: any): TestHelper<T>;
    constructor(builder: Builder<T>, _expect: ExpectStatic);
    computeView: (...rules: ElementViewRulesBuilder<T>[]) => any;
    processPredicates(...rules: ElementViewRulesBuilder<T>[]): ProcessPredicates<T>;
    processPredicatesWithScope(scope: T['Fqn'], ...rules: ElementViewRulesBuilder<T>[]): ProcessPredicates<T>;
    expectView(view: ComputedView): {
        toHave: (nodesAndEdges: {
            nodes: Array<T["Fqn"]>;
            edges: Array<ConnectionExpression<T>>;
        }) => void;
        toHaveNodes: <Id extends T["Fqn"]>(...nodes: Id[]) => void;
        toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => void;
    };
    expectComputedView(...rules: ElementViewRulesBuilder<T>[]): {
        toHave: (nodesAndEdges: {
            nodes: Array<T["Fqn"]>;
            edges: Array<ConnectionExpression<T>>;
        }) => void;
        toHaveNodes: <Id extends T["Fqn"]>(...nodes: Id[]) => void;
        toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => void;
    };
    expectMemory: (memory: Memory) => {
        toHaveAllElements: <Id extends T["Fqn"]>(...ids: Id[]) => void;
        /**
         * Final elements (visible in the view)
         */
        toHaveElements: <Id extends T["Fqn"]>(...ids: Id[]) => void;
        toHaveConnections: (...matchers: ConnectionEqual<T>) => void;
    };
    expectElements: (elements: ReadonlySet<ElementModel<Any>>) => {
        toEqual: <const Id extends ViewPredicate.DeploymentConnectionExpression<T>>(...ids: Id[]) => void;
    };
    expectConnections: (connections: ReadonlyArray<typeof this.Connection>) => {
        toBeEmpty: () => void;
        toEqual: (...matchers: ConnectionEqual<T>) => void;
    };
    expectStep: (step: ProcessPredicates<T>) => {
        toHaveAllElements: <Id extends T["Fqn"]>(...ids: Id[]) => void;
        /**
         * Final elements (visible in the view)
         */
        toHaveElements: <Id extends T["Fqn"]>(...ids: Id[]) => void;
        toHaveConnections: (...matchers: ConnectionEqual<T>) => void;
    };
    expect(value: typeof this.CompView): ReturnType<typeof this['expectView']>;
    expect(value: Set<ElementModel<Any>>): ReturnType<typeof this['expectElements']>;
    expect(value: ReadonlyArray<typeof this.Connection>): ReturnType<typeof this['expectConnections']>;
    expect(value: Memory | ProcessPredicates<T>): ReturnType<typeof this['expectMemory']>;
}
declare class ProcessPredicates<T extends AnyTypes> {
    readonly t: TestHelper<T>;
    scope: T['Fqn'] | null;
    protected age: number;
    static execute<B extends AnyTypes>(test: TestHelper<B>, ...rules: ElementViewRulesBuilder<B>[]): ProcessPredicates<B>;
    static executeWithScope<A extends AnyTypes>(test: TestHelper<A>, scope: A['Fqn'], ...rules: ElementViewRulesBuilder<A>[]): ProcessPredicates<A>;
    viewrules: ReadonlyArray<ViewRule<typeof this.t.model.Aux>>;
    previousMemory: Memory;
    memory: Memory;
    predicates: ElementViewRulesBuilder<T>[];
    constructor(t: TestHelper<T>, scope?: T['Fqn'] | null, age?: number);
    get elements(): any;
    get connections(): any;
    diff(): {
        added: any;
        removed: any;
    };
    next(...predicates: ElementViewRulesBuilder<T>[]): this;
}
export {};
