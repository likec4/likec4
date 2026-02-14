import type * as aux from './_aux';
import type { AnyAux } from './_aux';
import type { NonEmptyArray } from './_common';
import type { _stage } from './const';
import type { BBox, Point, XYPoint } from '../geometry';
import type { GlobalPredicateId, GlobalStyleID } from './global';
import type * as scalar from './scalar';
import type { BorderStyle, Color, ElementShape, IconPosition, IconSize, ShapeSize, SpacingSize, TextSize } from './styles';
export interface AnyIncludePredicate<Expr> {
    include: Expr[];
    exclude?: never;
}
export interface AnyExcludePredicate<Expr> {
    include?: never;
    exclude: Expr[];
}
export interface AnyViewRuleStyle<Expr> {
    targets: Expr[];
    notation?: string;
    style: {
        border?: BorderStyle;
        opacity?: number;
        multiple?: boolean;
        size?: ShapeSize;
        padding?: SpacingSize;
        textSize?: TextSize;
        color?: Color;
        shape?: ElementShape;
        icon?: scalar.Icon;
        iconColor?: Color;
        iconSize?: IconSize;
        iconPosition?: IconPosition;
    };
}
export interface ViewRuleGlobalStyle {
    styleId: GlobalStyleID;
}
export declare function isViewRuleGlobalStyle(rule: object): rule is ViewRuleGlobalStyle;
export interface ViewRuleGlobalPredicateRef {
    predicateId: GlobalPredicateId;
}
export declare function isViewRuleGlobalPredicateRef(rule: object): rule is ViewRuleGlobalPredicateRef;
export type RankValue = 'max' | 'min' | 'same' | 'sink' | 'source';
export interface ViewRuleRank<Expr> {
    targets: Expr[];
    rank: RankValue;
}
export type AutoLayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
export declare function isAutoLayoutDirection(autoLayout: unknown): autoLayout is AutoLayoutDirection;
export interface ViewRuleAutoLayout {
    direction: AutoLayoutDirection;
    nodeSep?: number;
    rankSep?: number;
}
export declare function isViewRuleAutoLayout(rule: object): rule is ViewRuleAutoLayout;
export interface ViewAutoLayout {
    direction: ViewRuleAutoLayout['direction'];
    rankSep?: number;
    nodeSep?: number;
}
/**
 * v1 Manual layout of a view, stored in the block comment to the view definition.
 * Keeping this type for backward compatibility and migration purposes.
 *
 * @deprecated Use {@link ViewManualLayoutSnapshot} instead
 */
export type ViewManualLayout = {
    readonly hash: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly autoLayout: ViewAutoLayout;
    readonly nodes: Record<string, {
        isCompound: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    readonly edges: Record<string, {
        points: NonEmptyArray<Point>;
        controlPoints?: NonEmptyArray<XYPoint>;
        labelBBox?: BBox;
    }>;
};
export type ViewType = 'element' | 'dynamic' | 'deployment';
export interface BaseViewProperties<A extends AnyAux> extends aux.WithOptionalTags<A>, aux.WithOptionalLinks {
    readonly id: aux.StrictViewId<A>;
    readonly title: string | null;
    readonly description: scalar.MarkdownOrString | null;
    /**
     * Source file containing this view, relative to the project root.
     * Undefined if the view is auto-generated.
     */
    readonly sourcePath?: string | undefined;
}
export interface BaseParsedViewProperties<A extends AnyAux> extends BaseViewProperties<A> {
    /**
     * Internal field to identify the stage of the view.
     * This is used to create the correct type of the view.
     */
    readonly [_stage]: 'parsed';
    /**
     * URI to the source file of this view.
     * Undefined if the view is auto-generated.
     */
    readonly docUri?: string | undefined;
}
export type NodeNotation = {
    kinds: string[];
    shape: ElementShape;
    color: Color;
    title: string;
};
export interface ViewWithNotation {
    notation?: {
        nodes: NodeNotation[];
    };
}
export interface ViewWithHash {
    /**
     * Hash of the view object.
     * This is used to detect changes in layout
     */
    hash: string;
}
