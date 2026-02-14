import { type AnyAux, type AnyViewRuleStyle, type ComputedNode, type ElementViewRule, type Predicate } from '../../types';
export declare function applyViewRuleStyle<A extends AnyAux>(rule: Pick<AnyViewRuleStyle<A>, 'style' | 'notation'>, predicate: Predicate<ComputedNode<A>>, nodes: ComputedNode<A>[]): void;
export declare function applyViewRuleStyles<A extends AnyAux, N extends ComputedNode<A>[]>(rules: ElementViewRule<A>[], nodes: N): N;
