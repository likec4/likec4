import type { AnyAux, Color, IteratorLike, Link, RelationshipArrowType, scalar } from '../types';
import { type Relationship, type RelationshipLineType, type RichTextOrEmpty } from '../types';
import type * as aux from '../types/_aux';
import type { DeploymentRelationModel } from './DeploymentElementModel';
import type { ElementModel } from './ElementModel';
import type { LikeC4Model } from './LikeC4Model';
import type { WithMetadata, WithTags } from './types';
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel';
export type RelationshipsIterator<A extends AnyAux> = IteratorLike<RelationshipModel<A>>;
/**
 * A relationship between two elements (in logical or deployment model)
 * use {@link isDeploymentRelationModel} guard to check if the relationship is a deployment relationship
 */
export interface AnyRelationshipModel<A extends AnyAux = AnyAux> extends WithTags<A>, WithMetadata<A> {
    readonly id: scalar.RelationId;
    readonly expression: string;
    readonly title: string | null;
    readonly technology: string | null;
    readonly hasSummary: boolean;
    readonly summary: RichTextOrEmpty;
    readonly description: RichTextOrEmpty;
    readonly navigateTo: LikeC4ViewModel<A> | null;
    readonly kind: aux.RelationKind<A> | null;
    readonly links: ReadonlyArray<Link>;
    readonly color: Color;
    readonly line: RelationshipLineType;
    readonly head: RelationshipArrowType;
    readonly tail: RelationshipArrowType | undefined;
    isDeploymentRelation(): this is DeploymentRelationModel<A>;
    isModelRelation(): this is RelationshipModel<A>;
    views(): ViewsIterator<A>;
}
export declare class RelationshipModel<A extends AnyAux = AnyAux> implements AnyRelationshipModel<A> {
    readonly model: LikeC4Model<A>;
    readonly $relationship: Relationship<A>;
    readonly source: ElementModel<A>;
    readonly target: ElementModel<A>;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the Relation.
     */
    readonly boundary: ElementModel<A> | null;
    constructor(model: LikeC4Model<A>, $relationship: Relationship<A>);
    get id(): scalar.RelationId;
    get expression(): string;
    get title(): string | null;
    get technology(): string | null;
    /**
     * Returns true if the relationship has a summary and a description
     * (if one is missing - it falls back to another)
     */
    get hasSummary(): boolean;
    /**
     * Short description of the relationship.
     * Falls back to description if summary is not provided.
     */
    get summary(): RichTextOrEmpty;
    /**
     * Long description of the relationship.
     * Falls back to summary if description is not provided.
     */
    get description(): RichTextOrEmpty;
    get navigateTo(): LikeC4ViewModel<A> | null;
    get tags(): aux.Tags<A>;
    get kind(): aux.RelationKind<A> | null;
    get links(): ReadonlyArray<Link>;
    get color(): Color;
    get line(): RelationshipLineType;
    get head(): RelationshipArrowType;
    get tail(): RelationshipArrowType | undefined;
    /**
     * Iterate over all views that include this relationship.
     */
    views(): ViewsIterator<A>;
    isDeploymentRelation(): this is DeploymentRelationModel<A>;
    isModelRelation(): this is RelationshipModel<A>;
    hasMetadata(): boolean;
    getMetadata(): aux.Metadata<A>;
    getMetadata(field: aux.MetadataKey<A>): string | string[] | undefined;
    /**
     * Checks if the relationship has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
