import { type AnyAux, type aux, type Color, type DeploymentRelationship, type NonEmptyArray, type Relationship, type RelationshipArrowType, type RelationshipLineType, type scalar } from '../../types';
export type MergedRelationshipProps<A extends AnyAux> = {
    title?: string | null;
    description?: scalar.MarkdownOrString | null;
    technology?: string;
    kind?: aux.RelationKind<A>;
    color?: Color;
    line?: RelationshipLineType;
    head?: RelationshipArrowType;
    tail?: RelationshipArrowType;
    navigateTo?: aux.StrictViewId<A>;
    tags?: NonEmptyArray<aux.Tag<A>>;
};
/**
 * Merges properties from multiple relationships into a single object.
 * @param relations - The relationships to merge.
 * @param prefer - The relationship to prefer when merging.
 */
export declare function mergePropsFromRelationships<A extends AnyAux>(relations: Array<Relationship<A> | DeploymentRelationship<A>>, prefer?: Relationship<A> | DeploymentRelationship<A>): MergedRelationshipProps<A>;
