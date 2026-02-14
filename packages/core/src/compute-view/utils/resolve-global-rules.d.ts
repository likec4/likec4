import { type AnyAux, type DynamicViewRule, type ElementViewRule, type ModelGlobals, type ParsedDynamicView, type ParsedElementView, type ViewRuleGlobalPredicateRef, type ViewRuleGlobalStyle } from '../../types';
export declare function resolveGlobalRules<A extends AnyAux>(view: ParsedElementView<A> | ParsedDynamicView<A>, globals: ModelGlobals<A>): any;
export type ViewRuleGlobal = ViewRuleGlobalPredicateRef | ViewRuleGlobalStyle;
export declare function resolveGlobalRulesInElementView<M extends AnyAux>(rules: ElementViewRule<M>[], globals: ModelGlobals<M>): Array<Exclude<ElementViewRule<M>, ViewRuleGlobal>>;
export declare function resolveGlobalRulesInDynamicView<M extends AnyAux>(rules: DynamicViewRule<M>[], globals: ModelGlobals<M>): Array<Exclude<DynamicViewRule<M>, ViewRuleGlobal>>;
