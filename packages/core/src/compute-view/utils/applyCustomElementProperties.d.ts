import { type AnyAux, type ComputedNode, type ElementViewRule, type ModelExpression } from '../../types';
export declare function flattenGroupRules<A extends AnyAux, T extends ModelExpression<A>>(guard: (expr: ModelExpression<A>) => expr is T): (rule: ElementViewRule<A>) => Array<T>;
export declare function applyCustomElementProperties<A extends AnyAux>(_rules: ElementViewRule<A>[], _nodes: ComputedNode<A>[]): ComputedNode<A>[];
