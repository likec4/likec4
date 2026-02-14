import type { ElementModel } from '../../model';
import type { LikeC4Model } from '../../model/LikeC4Model';
import { type Any, type aux, type Color, type DynamicStep, type DynamicViewRule, type DynamicViewStep, type MarkdownOrString, type NonEmptyArray, type RelationshipLineType, type ViewRuleGlobalStyle } from '../../types';
export declare function elementsFromIncludeProperties<A extends Any>(model: LikeC4Model<A>, resolvedRules: Array<Exclude<DynamicViewRule<A>, ViewRuleGlobalStyle>>): Set<ElementModel<A>>;
export declare const flattenSteps: <A extends Any>(s: DynamicViewStep<A>) => DynamicStep<A> | DynamicStep<A>[];
export declare function elementsFromSteps<A extends Any>(model: LikeC4Model<A>, steps: DynamicViewStep<A>[]): Set<ElementModel<A>>;
export declare function findRelations<A extends Any>(source: ElementModel<A>, target: ElementModel<A>, currentViewId: aux.StrictViewId<A>): {
    title?: string;
    kind?: aux.RelationKind<A>;
    tags?: aux.Tags<A>;
    relations?: NonEmptyArray<aux.RelationId>;
    navigateTo?: aux.StrictViewId<A>;
    color?: Color;
    line?: RelationshipLineType;
    technology?: string;
    description?: MarkdownOrString;
};
