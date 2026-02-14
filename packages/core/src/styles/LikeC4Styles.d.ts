import type { LiteralUnion } from 'type-fest';
import type { ComputedNodeStyle, LikeC4ProjectStylesConfig, LikeC4ProjectStylesCustomStylesheets, NTuple } from '../types';
import type { CustomColorDefinitions, ElementColorValues, IconSize, LikeC4StyleDefaults, LikeC4StylesConfig, LikeC4Theme, RelationshipColorValues, SpacingSize, TextSize, ThemeColor, ThemeColorValues } from './types';
export declare const defaultStyle: LikeC4StylesConfig;
/**
 * Styles of a LikeC4 project
 *
 * Accepts an array of LikeC4ProjectStylesConfig objects as a parameter
 * and constructs a LikeC4Styles merged with the default styles.
 *
 * The class provides methods to get the default element colors, relationship
 * colors, group colors, font size in pixels, padding in pixels, and to compute
 * the ThemeColorValues from a given color.
 */
export declare class LikeC4Styles {
    protected config: LikeC4StylesConfig;
    protected customCss?: LikeC4ProjectStylesCustomStylesheets;
    readonly theme: LikeC4Theme;
    readonly defaults: LikeC4StyleDefaults;
    static readonly DEFAULT: LikeC4Styles;
    static from(stylesConfig: LikeC4ProjectStylesConfig | undefined, customColors?: CustomColorDefinitions | undefined): LikeC4Styles;
    private constructor();
    /**
     * Default element colors
     */
    get elementColors(): ElementColorValues;
    /**
     * Default relationship colors
     */
    get relationshipColors(): RelationshipColorValues;
    /**
     * Default group colors
     */
    get groupColors(): ElementColorValues;
    isDefaultColor(color: LiteralUnion<ThemeColor, string>): color is ThemeColor;
    /**
     * Get color values
     *
     * @param color - The color to use
     * @default color From the defaults
     */
    colors(color?: LiteralUnion<ThemeColor, string>): ThemeColorValues;
    private compoundColorsCache;
    /**
     * Get colors for compound nodes
     *
     * @param baseElementColors - The base element colors to compute from
     */
    colorsForCompounds<Depth extends number = 6>(baseElementColors: ElementColorValues, depth?: Depth): NTuple<ElementColorValues, Depth>;
    /**
     * Get font size in pixels
     *
     * @param textSize - The text size to use
     * @default textSize From the defaults
     */
    fontSize(textSize?: TextSize): number;
    /**
     * Get padding in pixels
     *
     * @param paddingSize - The padding size to use
     * @default paddingSize From the defaults
     */
    padding(paddingSize?: SpacingSize): number;
    /**
     * Get icon size in pixels
     *
     * @param iconSize - The icon size to use
     * @default iconSize From the defaults
     */
    iconSize(iconSize?: IconSize): number;
    isThemeColor(color: string): color is ThemeColor;
    /**
     * Calculate sizes and values based on the node styles
     *
     * @example
     * ```typescript
     * const { sizes, values } = styles.nodeSizes(node.style)
     *
     * // sizes
     * sizes.size     // enum Size
     * sizes.padding  // enum SpacingSize
     * sizes.textSize // enum TextSize
     * sizes.iconSize // enum ShapeSize
     *
     * // values
     * values.sizes    // { width: number, height: number }
     * values.padding  // number
     * values.textSize // number
     * values.iconSize // number
     * ```
     */
    nodeSizes(nodestyles: ComputedNodeStyle): {
        sizes: any;
        values: {
            sizes: {
                readonly width: number;
                readonly height: number;
            };
            padding: number;
            textSize: number;
            iconSize: number;
        };
    };
    /**
     * Compute ThemeColorValues from a given color
     * @param color - HEX, RGB, RGBA, etc.
     */
    computeFrom(color: string): ThemeColorValues;
    equals(other: LikeC4Styles): boolean;
}
