import type { BorderStyle, Color, ElementShape, IconPosition, RelationshipArrowType, RelationshipLineType, ShapeSize } from '../styles/types';
import type * as aux from './_aux';
import type { ExclusiveUnion } from './_common';
import { FqnRef } from './fqnRef';
import type { WhereOperator } from './operators';
import type * as scalar from './scalar';
type AnyAux = aux.Any;
export type PredicateSelector = 'children' | 'expanded' | 'descendants';
export declare namespace FqnExpr {
    type Wildcard = {
        wildcard: true;
    };
    function isWildcard<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Wildcard;
    interface ModelRef<M extends AnyAux = AnyAux> {
        ref: FqnRef.ModelRef<M>;
        selector?: PredicateSelector;
    }
    function isModelRef<A extends AnyAux>(ref: Expression<A>): ref is FqnExpr.ModelRef<A>;
    interface DeploymentRef<A extends AnyAux = AnyAux> {
        ref: FqnRef.DeploymentRef<A>;
        selector?: PredicateSelector;
    }
    function isDeploymentRef<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.DeploymentRef<A>;
    interface ElementKindExpr<A extends AnyAux = AnyAux> {
        elementKind: aux.ElementKind<A>;
        isEqual: boolean;
    }
    function isElementKindExpr<A extends AnyAux>(expr: Expression<A>): expr is ElementKindExpr<A>;
    interface ElementTagExpr<A extends AnyAux = AnyAux> {
        elementTag: aux.Tag<A>;
        isEqual: boolean;
    }
    function isElementTagExpr<A extends AnyAux>(expr: Expression<A>): expr is ElementTagExpr<A>;
    type NonWildcard<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        ModelRef: ModelRef<A>;
        DeploymentRef: DeploymentRef<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
    }>;
    interface Where<A extends AnyAux = AnyAux> {
        where: {
            expr: ExclusiveUnion<{
                Wildcard: Wildcard;
                ModelRef: ModelRef<A>;
                DeploymentRef: DeploymentRef<A>;
                ElementKind: ElementKindExpr<A>;
                ElementTag: ElementTagExpr<A>;
            }>;
            condition: WhereOperator<A>;
        };
    }
    function isWhere<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Where<A>;
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
    function isCustom<A extends AnyAux>(expr: Expression<A>): expr is Custom<A>;
    function is<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr<A>;
    type OrWhere<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Wildcard: FqnExpr.Wildcard;
        ModelRef: FqnExpr.ModelRef<A>;
        DeploymentRef: FqnExpr.DeploymentRef<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
        Where: FqnExpr.Where<A>;
    }>;
    type Any<A extends AnyAux = AnyAux> = ExclusiveUnion<{
        Wildcard: Wildcard;
        ModelRef: ModelRef<A>;
        DeploymentRef: DeploymentRef<A>;
        ElementKind: ElementKindExpr<A>;
        ElementTag: ElementTagExpr<A>;
        Where: Where<A>;
        Custom: Custom<A>;
    }>;
    function unwrap<A extends AnyAux>(expr: FqnExpr.Any<A>): Wildcard | ModelRef<A> | DeploymentRef<A> | ElementKindExpr<A> | ElementTagExpr<A>;
}
export type FqnExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard;
    ModelRef: FqnExpr.ModelRef<A>;
    DeploymentRef: FqnExpr.DeploymentRef<A>;
    ElementKind: FqnExpr.ElementKindExpr<A>;
    ElementTag: FqnExpr.ElementTagExpr<A>;
}>;
export declare namespace RelationExpr {
    type Endpoint<A extends AnyAux = AnyAux> = FqnExpr.Where<A>['where']['expr'];
    interface Direct<A extends AnyAux = AnyAux> {
        source: Endpoint<A>;
        target: Endpoint<A>;
        isBidirectional?: boolean;
    }
    function isDirect<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Direct<A>;
    interface Incoming<A extends AnyAux = AnyAux> {
        incoming: Endpoint<A>;
    }
    function isIncoming<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Incoming<A>;
    interface Outgoing<A extends AnyAux = AnyAux> {
        outgoing: Endpoint<A>;
    }
    function isOutgoing<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Outgoing<A>;
    interface InOut<A extends AnyAux = AnyAux> {
        inout: Endpoint<A>;
    }
    function isInOut<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.InOut<A>;
    interface Where<A extends AnyAux = AnyAux> {
        where: {
            expr: ExclusiveUnion<{
                Direct: RelationExpr.Direct<A>;
                Incoming: RelationExpr.Incoming<A>;
                Outgoing: RelationExpr.Outgoing<A>;
                InOut: RelationExpr.InOut<A>;
            }>;
            condition: WhereOperator<A>;
        };
    }
    function isWhere<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Where<A>;
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
    function isCustom<A extends AnyAux>(expr: Expression<A>): expr is Custom<A>;
    function is<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr<A>;
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
    function unwrap<A extends AnyAux>(expr: RelationExpr.Any<A>): Direct<A> | Incoming<A> | Outgoing<A> | InOut<A>;
}
export type RelationExpr<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Direct: RelationExpr.Direct<A>;
    Incoming: RelationExpr.Incoming<A>;
    Outgoing: RelationExpr.Outgoing<A>;
    InOut: RelationExpr.InOut<A>;
}>;
/**
 * Represents a version 2 expression which can be one of several types.
 *
 * @template D - The type for the deployment FQN, defaults to `Fqn`.
 * @template M - The type for the model FQN, defaults to `Fqn`.
 */
export type Expression<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard;
    ModelRef: FqnExpr.ModelRef<A>;
    DeploymentRef: FqnExpr.DeploymentRef<A>;
    ElementKind: FqnExpr.ElementKindExpr<A>;
    ElementTag: FqnExpr.ElementTagExpr<A>;
    Custom: FqnExpr.Custom<A>;
    Direct: RelationExpr.Direct<A>;
    Incoming: RelationExpr.Incoming<A>;
    Outgoing: RelationExpr.Outgoing<A>;
    InOut: RelationExpr.InOut<A>;
    Where: Expression.Where<A>;
    CustomRelation: RelationExpr.Custom<A>;
}>;
export declare namespace Expression {
    type Where<A extends AnyAux = AnyAux> = FqnExpr.Where<A> | RelationExpr.Where<A>;
    function isWhere<A extends AnyAux>(expr: Expression<A>): expr is Expression.Where<A>;
    function isRelationWhere<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Where<A>;
    function isFqnExprWhere<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Where<A>;
    function isFqnExpr<A extends AnyAux>(expr: Expression<A>): expr is FqnExpr.Any<A>;
    function isRelation<A extends AnyAux>(expr: Expression<A>): expr is RelationExpr.Any<A>;
}
export {};
