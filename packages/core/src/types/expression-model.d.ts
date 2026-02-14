import type { BorderStyle, Color, ElementShape, IconPosition, RelationshipArrowType, RelationshipLineType, ShapeSize } from '../styles/types';
import type * as aux from './_aux';
import type { ExclusiveUnion } from './_common';
import type { PredicateSelector } from './expression';
import { FqnRef } from './fqnRef';
import type { WhereOperator } from './operators';
import type * as scalar from './scalar';
type AnyAux = aux.Any;
export declare namespace ModelFqnExpr {
    type Wildcard = {
        wildcard: true;
    };
    function isWildcard<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Wildcard;
    interface Ref<M extends AnyAux = AnyAux> {
        ref: FqnRef.ModelRef<M>;
        selector?: PredicateSelector;
    }
    function isModelRef<A extends AnyAux>(ref: ModelExpression<A>): ref is ModelFqnExpr.Ref<A>;
    interface ElementKindExpr<A extends AnyAux = AnyAux> {
        elementKind: aux.ElementKind<A>;
        isEqual: boolean;
    }
    function isElementKindExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ElementKindExpr<A>;
    interface ElementTagExpr<A extends AnyAux> {
        elementTag: aux.Tag<A>;
        isEqual: boolean;
    }
    function isElementTagExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ElementTagExpr<A>;
    type NonWildcard<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Ref: Ref<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
    }>;
    interface Where<A extends AnyAux = AnyAux> {
        where: {
            expr: ExclusiveUnion<{
                Wildcard: Wildcard;
                Ref: Ref<A>;
                ElementKind: ElementKindExpr<A>;
                ElementTag: ElementTagExpr<A>;
            }>;
            condition: WhereOperator<A>;
        };
    }
    function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Where<A>;
    interface Custom<A extends AnyAux = AnyAux> {
        custom: {
            expr: OrWhere<A>;
            title?: string;
            description?: scalar.MarkdownOrString;
            technology?: string;
            notation?: string;
            notes?: scalar.MarkdownOrString;
            shape?: ElementShape;
            color?: Color;
            icon?: scalar.Icon;
            iconColor?: Color;
            iconSize?: ShapeSize;
            iconPosition?: IconPosition;
            border?: BorderStyle;
            opacity?: number;
            navigateTo?: aux.StrictViewId<A>;
            multiple?: boolean;
            size?: ShapeSize;
            padding?: ShapeSize;
            textSize?: ShapeSize;
        };
    }
    function isCustom<A extends AnyAux>(expr: ModelExpression<A>): expr is Custom<A>;
    function is<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr<A>;
    type OrWhere<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Wildcard: ModelFqnExpr.Wildcard;
        Ref: ModelFqnExpr.Ref<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
        Where: ModelFqnExpr.Where<A>;
    }>;
    type Any<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Wildcard: Wildcard;
        Ref: Ref<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
        Where: Where<A>;
        Custom: Custom<A>;
    }>;
    function unwrap<A extends AnyAux>(expr: ModelFqnExpr.Any<A>): Wildcard | Ref<A> | ElementKindExpr<A> | ElementTagExpr<A>;
}
export type ModelFqnExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: ModelFqnExpr.Wildcard;
    Ref: ModelFqnExpr.Ref<A>;
    ElementKind: ModelFqnExpr.ElementKindExpr<A>;
    ElementTag: ModelFqnExpr.ElementTagExpr<A>;
}>;
export declare namespace ModelRelationExpr {
    type Endpoint<A extends AnyAux = AnyAux> = ModelFqnExpr.Where<A>['where']['expr'];
    interface Direct<A extends AnyAux = AnyAux> {
        source: Endpoint<A>;
        target: Endpoint<A>;
        isBidirectional?: boolean;
    }
    function isDirect<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Direct<A>;
    interface Incoming<A extends AnyAux = AnyAux> {
        incoming: Endpoint<A>;
    }
    function isIncoming<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Incoming<A>;
    interface Outgoing<A extends AnyAux = AnyAux> {
        outgoing: Endpoint<A>;
    }
    function isOutgoing<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Outgoing<A>;
    interface InOut<A extends AnyAux = AnyAux> {
        inout: Endpoint<A>;
    }
    function isInOut<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.InOut<A>;
    interface Where<A extends AnyAux = AnyAux> {
        where: {
            expr: ExclusiveUnion<{
                Direct: ModelRelationExpr.Direct<A>;
                Incoming: ModelRelationExpr.Incoming<A>;
                Outgoing: ModelRelationExpr.Outgoing<A>;
                InOut: ModelRelationExpr.InOut<A>;
            }>;
            condition: WhereOperator<A>;
        };
    }
    function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Where<A>;
    interface Custom<A extends AnyAux = AnyAux> {
        customRelation: {
            expr: OrWhere<A>;
            title?: string;
            description?: scalar.MarkdownOrString;
            technology?: string;
            notation?: string;
            navigateTo?: aux.StrictViewId<A>;
            notes?: scalar.MarkdownOrString;
            color?: Color;
            line?: RelationshipLineType;
            head?: RelationshipArrowType;
            tail?: RelationshipArrowType;
        };
    }
    function isCustom<A extends AnyAux>(expr: ModelExpression<A>): expr is Custom<A>;
    function is<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr<A>;
    type OrWhere<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Direct: Direct<A>;
        Incoming: Incoming<A>;
        Outgoing: Outgoing<A>;
        InOut: InOut<A>;
        Where: Where<A>;
    }>;
    type Any<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Direct: Direct<A>;
        Incoming: Incoming<A>;
        Outgoing: Outgoing<A>;
        InOut: InOut<A>;
        Where: Where<A>;
        Custom: Custom<A>;
    }>;
    function unwrap<A extends AnyAux>(expr: ModelRelationExpr.Any<A>): Direct<A> | Incoming<A> | Outgoing<A> | InOut<A>;
}
export type ModelRelationExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Direct: ModelRelationExpr.Direct<A>;
    Incoming: ModelRelationExpr.Incoming<A>;
    Outgoing: ModelRelationExpr.Outgoing<A>;
    InOut: ModelRelationExpr.InOut<A>;
}>;
/**
 * Represents a version 2 expression which can be one of several types.
 *
 * @template D - The type for the deployment FQN, defaults to `Fqn`.
 * @template M - The type for the model FQN, defaults to `Fqn`.
 */
export type ModelExpression<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: ModelFqnExpr.Wildcard;
    Ref: ModelFqnExpr.Ref<A>;
    ElementKind: ModelFqnExpr.ElementKindExpr<A>;
    ElementTag: ModelFqnExpr.ElementTagExpr<A>;
    Custom: ModelFqnExpr.Custom<A>;
    Direct: ModelRelationExpr.Direct<A>;
    Incoming: ModelRelationExpr.Incoming<A>;
    Outgoing: ModelRelationExpr.Outgoing<A>;
    InOut: ModelRelationExpr.InOut<A>;
    Where: ModelExpression.Where<A>;
    CustomRelation: ModelRelationExpr.Custom<A>;
}>;
export declare namespace ModelExpression {
    type Where<A extends AnyAux = AnyAux> = ModelFqnExpr.Where<A> | ModelRelationExpr.Where<A>;
    function isWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelExpression.Where<A>;
    function isRelationWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Where<A>;
    function isFqnExprWhere<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Where<A>;
    function isFqnExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelFqnExpr.Any<A>;
    function isRelationExpr<A extends AnyAux>(expr: ModelExpression<A>): expr is ModelRelationExpr.Any<A>;
}
export {};
