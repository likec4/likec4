import type { ExpectStatic } from 'vitest';
import type { AnyTypes, Builder, DeploymentRulesBuilderOp, Types, ViewPredicate } from '../../../builder';
import * as viewhelpers from '../../../builder/Builder.view-common';
import type { LikeC4Model } from '../../../model';
import { type AnyAux, type ComputedDeploymentView, type DeploymentViewRule } from '../../../types';
import { Memory } from '../memory';
type ConnectionExpression<T extends AnyTypes> = `${T['DeploymentFqn']} -> ${T['DeploymentFqn']}`;
type ConnectionsDeepMatcher<M extends string, D extends string> = {
    [K in `${D} -> ${D}`]?: {
        model?: Array<`${M} -> ${M}`>;
        deployment?: Array<`${D} -> ${D}`>;
    };
};
type ToDeepMatcher<T extends AnyTypes> = ConnectionsDeepMatcher<T['Fqn'], T['DeploymentFqn']>;
type ConnectionEqual<T extends AnyTypes> = [ToDeepMatcher<T>] | [ConnectionExpression<T>, ...ConnectionExpression<T>[]];
type Elem = Memory['Ctx']['Element'];
type Connection = Memory['Ctx']['Connection'];
export declare class TestHelper<T extends AnyTypes> {
    private builder;
    private _expect;
    Aux: Types.ToAux<T>;
    model: LikeC4Model.Computed<typeof this.Aux>;
    static $include: typeof viewhelpers.$include;
    static $exclude: typeof viewhelpers.$exclude;
    static $style: typeof viewhelpers.$style;
    $include: typeof viewhelpers.$include;
    $exclude: typeof viewhelpers.$exclude;
    $style: typeof viewhelpers.$style;
    static from<const T extends AnyTypes>(builder: Builder<T>, expect?: any): TestHelper<T>;
    constructor(builder: Builder<T>, _expect: ExpectStatic);
    computeView: (...rules: DeploymentRulesBuilderOp<T>[]) => any;
    processPredicates(...rules: DeploymentRulesBuilderOp<T>[]): ProcessPredicates<T>;
    expectView(view: ComputedDeploymentView): {
        toHave: (nodesAndEdges: {
            nodes: Array<T["DeploymentFqn"]>;
            edges: Array<ConnectionExpression<T>>;
        }) => void;
        toHaveNodes: <Id extends T["DeploymentFqn"]>(...nodes: Id[]) => void;
        toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => void;
    };
    expectComputedView(...rules: DeploymentRulesBuilderOp<T>[]): {
        toHave: (nodesAndEdges: {
            nodes: Array<T["DeploymentFqn"]>;
            edges: Array<ConnectionExpression<T>>;
        }) => void;
        toHaveNodes: <Id extends T["DeploymentFqn"]>(...nodes: Id[]) => void;
        toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => void;
    };
    expectMemory: (memory: Memory) => {
        toHaveAllElements: <Id extends T["DeploymentFqn"]>(...ids: Id[]) => void;
        toHaveElements: <Id extends T["DeploymentFqn"]>(...ids: Id[]) => void;
        toHaveConnections: (...matchers: ConnectionEqual<T>) => void;
    };
    expectElements: (elements: ReadonlySet<Elem>) => {
        toEqual: <const Id extends ViewPredicate.DeploymentConnectionExpression<T>>(...ids: Id[]) => void;
    };
    expectConnections: (connections: ReadonlyArray<Connection>) => {
        toBeEmpty: () => void;
        toEqual: (...matchers: ConnectionEqual<T>) => void;
    };
    expectStep: (step: ProcessPredicates<T>) => {
        toHaveAllElements: <Id extends T["DeploymentFqn"]>(...ids: Id[]) => void;
        toHaveElements: <Id extends T["DeploymentFqn"]>(...ids: Id[]) => void;
        toHaveConnections: (...matchers: ConnectionEqual<T>) => void;
    };
    expect(value: ComputedDeploymentView): ReturnType<typeof this['expectView']>;
    expect(value: Set<Elem>): ReturnType<typeof this['expectElements']>;
    expect(value: ReadonlyArray<Connection>): ReturnType<typeof this['expectConnections']>;
    expect(value: Memory | ProcessPredicates<T>): ReturnType<typeof this['expectMemory']>;
}
declare class ProcessPredicates<T extends AnyTypes> {
    readonly t: TestHelper<T>;
    protected age: number;
    static execute<A extends AnyTypes>(test: TestHelper<A>, ...rules: DeploymentRulesBuilderOp<A>[]): ProcessPredicates<A>;
    viewrules: ReadonlyArray<DeploymentViewRule<AnyAux>>;
    previousMemory: Memory;
    memory: Memory;
    predicates: DeploymentRulesBuilderOp<T>[];
    constructor(t: TestHelper<T>, age?: number);
    get elements(): any;
    get connections(): any;
    diff(): {
        added: any;
        removed: any;
    };
    next(...predicates: DeploymentRulesBuilderOp<T>[]): this;
}
export {};
