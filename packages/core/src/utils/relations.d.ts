export type RelationshipLike = {
    source: {
        id: string;
    };
    target: {
        id: string;
    };
};
export type RelationPredicate = (rel: RelationshipLike) => boolean;
/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific (deepest in the tree)
 */
export declare const compareRelations: <T extends RelationshipLike>(a: T, b: T) => number;
