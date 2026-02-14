import { indexBy, isArray, isString, map, mapValues, pipe, prop } from 'remeda';
import { expect as vitestExpect } from 'vitest';
import * as viewhelpers from '../../../builder/Builder.view-common';
import { mkViewBuilder } from '../../../builder/Builder.views';
import { differenceConnections } from '../../../model/connection';
import { _stage, _type, } from '../../../types';
import { compareNatural } from '../../../utils';
import { imap, toArray } from '../../../utils/iterable';
import { difference as differenceSet } from '../../../utils/set';
import { withReadableEdges } from '../../utils/with-readable-edges';
import { processPredicates as processPredicatesImpl } from '../compute';
import { Memory } from '../memory';
export class TestHelper {
    builder;
    _expect;
    model;
    Aux;
    Elem;
    Connection;
    CompView;
    static $include = viewhelpers.$include;
    static $exclude = viewhelpers.$exclude;
    static $rules = viewhelpers.$rules;
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
        return withReadableEdges(this.builder
            .clone()
            .views(_ => _.view('dev', _.$rules(...rules)))
            .toLikeC4Model()
            .view('dev')
            .$view, ' -> ');
    };
    processPredicates(...rules) {
        return ProcessPredicates.execute(this, ...rules);
    }
    processPredicatesWithScope(scope, ...rules) {
        return ProcessPredicates.executeWithScope(this, scope, ...rules);
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
        /**
         * Final elements (visible in the view)
         */
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
            this._expect(connections.map(c => c.expression)).to.be.empty;
        },
        toEqual: (...matchers) => {
            const [matcher, ...rest] = matchers;
            if (isString(matcher)) {
                this._expect(connections.map(c => c.expression)).toEqual([matcher, ...rest]);
                return;
            }
            const obj = pipe(connections, indexBy(prop('expression')), mapValues(c => [...c.relations].map(prop('expression')).sort(compareNatural)));
            const expected = mapValues(matcher, (v) => [...v].sort(compareNatural));
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
    scope;
    age;
    static execute(test, ...rules) {
        const processor = new ProcessPredicates(test);
        processor.next(...rules);
        return processor;
    }
    static executeWithScope(test, scope, ...rules) {
        const processor = new ProcessPredicates(test, scope);
        processor.next(...rules);
        return processor;
    }
    viewrules = [];
    previousMemory = Memory.empty(null);
    memory = Memory.empty(null);
    predicates = [];
    constructor(t, scope = null, age = 0) {
        this.t = t;
        this.scope = scope;
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
            [_type]: 'element',
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
        const scope = this.scope ? this.t.model.element(this.scope) : null;
        this.memory = processPredicatesImpl(this.t.model, Memory.empty(scope), view.rules);
        this.age++;
        return this;
    }
}
