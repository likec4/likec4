import { indexBy, isArray, isString, map, mapValues, pipe, prop } from 'remeda';
import { expect as vitestExpect } from 'vitest';
import * as viewhelpers from '../../../builder/Builder.view-common';
import { mkViewBuilder } from '../../../builder/Builder.views';
import { differenceConnections } from '../../../model/connection';
import { _stage, _type, } from '../../../types';
import { difference as differenceSet, imap, invariant, toArray } from '../../../utils';
import { withReadableEdges } from '../../utils/with-readable-edges';
import { processPredicates as processPredicatesImpl } from '../compute';
import { Memory } from '../memory';
export class TestHelper {
    builder;
    _expect;
    Aux;
    model;
    static $include = viewhelpers.$include;
    static $exclude = viewhelpers.$exclude;
    static $style = viewhelpers.$style;
    $include = viewhelpers.$include;
    $exclude = viewhelpers.$exclude;
    $style = viewhelpers.$style;
    static from(builder, expect = vitestExpect) {
        return new TestHelper(builder, expect);
    }
    constructor(builder, _expect) {
        this.builder = builder;
        this._expect = _expect;
        this.model = builder.toLikeC4Model();
    }
    computeView = (...rules) => {
        const view = this.builder
            .clone()
            .views(_ => _.deploymentView('dev').with(...rules))
            .toLikeC4Model()
            .view('dev');
        invariant(view.isDeploymentView());
        return withReadableEdges(view.$view, ' -> ');
    };
    processPredicates(...rules) {
        return ProcessPredicates.execute(this, ...rules);
    }
    expectView(view) {
        return {
            toHave: (nodesAndEdges) => {
                const actual = {
                    nodes: view.nodes.map(prop('id')),
                    edges: view.edges.map(prop('id')),
                };
                this._expect(actual).toEqual(nodesAndEdges);
            },
            toHaveNodes: (...nodes) => {
                this._expect(view.nodes.map(prop('id'))).toEqual(nodes);
            },
            toHaveEdges: (...edges) => {
                this._expect(view.edges.map(prop('id'))).toEqual(edges);
            },
        };
    }
    expectComputedView(...rules) {
        return this.expectView(this.computeView(...rules));
    }
    expectMemory = (memory) => ({
        toHaveAllElements: (...ids) => {
            this._expect(map([...memory.elements], prop('id'))).toEqual(ids);
        },
        toHaveElements: (...ids) => {
            this._expect(map([...memory.final], prop('id'))).toEqual(ids);
        },
        toHaveConnections: (...matchers) => {
            this.expectConnections(memory.connections).toEqual(...matchers);
        },
    });
    expectElements = (elements) => ({
        toEqual: (...ids) => {
            this._expect(toArray(imap(elements, prop('id')))).toEqual(ids);
        },
    });
    expectConnections = (connections) => ({
        toBeEmpty: () => {
            this._expect(connections.map(c => c.expression)).toEqual([]);
        },
        toEqual: (...matchers) => {
            const [matcher, ...rest] = matchers;
            if (isString(matcher)) {
                this._expect(connections.map(c => c.expression)).toEqual([matcher, ...rest]);
                return;
            }
            const obj = pipe(connections, indexBy(prop('expression')), mapValues(c => ({
                model: toArray(imap(c.relations.model, prop('expression'))).sort(),
                deployment: toArray(imap(c.relations.deployment, prop('expression'))).sort(),
            })));
            const expected = mapValues(matcher, (v) => ({
                ...v,
                model: v.model ? [...v.model].sort() : [],
                deployment: v.deployment ? [...v.deployment].sort() : [],
            }));
            this._expect(obj).toEqual(expected);
        },
    });
    expectStep = (step) => ({
        ...this.expectMemory(step.memory),
    });
    expect(value) {
        if (value instanceof Memory) {
            return this.expectMemory(value);
        }
        if (value instanceof ProcessPredicates) {
            return this.expectStep(value);
        }
        if (value instanceof Set) {
            return this.expectElements(value);
        }
        if (isArray(value)) {
            return this.expectConnections(value);
        }
        return this.expectView(value);
    }
}
class ProcessPredicates {
    t;
    age;
    static execute(test, ...rules) {
        const processor = new ProcessPredicates(test);
        processor.next(...rules);
        return processor;
    }
    viewrules = [];
    previousMemory = Memory.empty();
    memory = Memory.empty();
    predicates = [];
    constructor(t, age = 0) {
        this.t = t;
        this.age = age;
    }
    get elements() {
        return toArray(imap(this.memory.elements, prop('id')));
    }
    get connections() {
        return this.memory.connections.map(c => c.expression);
    }
    diff() {
        const prevState = this.previousMemory;
        const state = this.memory;
        return {
            added: this.memory.update({
                elements: differenceSet(state.elements, prevState.elements),
                explicits: differenceSet(state.explicits, prevState.explicits),
                final: differenceSet(state.final, prevState.final),
                connections: differenceConnections(state.connections, prevState.connections),
            }),
            removed: this.memory.update({
                elements: differenceSet(prevState.elements, state.elements),
                explicits: differenceSet(prevState.explicits, state.explicits),
                final: differenceSet(prevState.final, state.final),
                connections: differenceConnections(prevState.connections, state.connections),
            }),
        };
    }
    next(...predicates) {
        const view = {
            id: 'test',
            [_stage]: 'parsed',
            [_type]: 'deployment',
            rules: [],
            title: null,
            description: null,
        };
        let vb = mkViewBuilder(view);
        this.predicates = [
            ...this.predicates,
            ...predicates,
        ];
        for (const rule of this.predicates) {
            rule(vb);
        }
        this.previousMemory = this.memory;
        this.viewrules = view.rules;
        this.memory = processPredicatesImpl(this.t.model.deployment, view.rules);
        this.age++;
        return this;
    }
}
