import chroma from 'chroma-js';
import { defu } from 'defu';
import { isDeepEqual, isEmptyish } from 'remeda';
import { ensureSizes } from '../types';
import { DefaultMap, DefaultWeakMap, memoizeProp } from '../utils';
import { computeColorValues } from './compute-color-values';
import { computeCompoundColorValues } from './compute-compound-colors';
import { styleDefaults } from './defaults';
import { defaultTheme } from './theme';
export const defaultStyle = {
    theme: defaultTheme,
    defaults: styleDefaults,
};
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
export class LikeC4Styles {
    config;
    customCss;
    theme;
    defaults;
    static DEFAULT = new LikeC4Styles(defaultStyle);
    static from(stylesConfig, customColors) {
        if (!stylesConfig && !customColors) {
            return this.DEFAULT;
        }
        const { customCss, theme, defaults } = { ...stylesConfig };
        const mergedConfig = defu({ theme }, { defaults: { ...defaults } }, { theme: { colors: { ...customColors } } }, defaultStyle);
        if (isEmptyish(customCss?.content) && isDeepEqual(mergedConfig, defaultStyle)) {
            return this.DEFAULT;
        }
        return new LikeC4Styles(mergedConfig, customCss);
    }
    constructor(config, customCss) {
        this.config = config;
        this.customCss = customCss;
        this.theme = config.theme;
        this.defaults = config.defaults;
    }
    /**
     * Default element colors
     */
    get elementColors() {
        return this.theme.colors[this.defaults.color].elements;
    }
    /**
     * Default relationship colors
     */
    get relationshipColors() {
        return this.theme.colors[this.defaults.relationship.color].relationships;
    }
    /**
     * Default group colors
     */
    get groupColors() {
        const color = this.defaults.group?.color;
        if (!color) {
            return this.elementColors;
        }
        if (!this.isThemeColor(color)) {
            throw new Error(`Default group color not found in theme: ${color}`);
        }
        return memoizeProp(this, 'defaultGroup', () => ({
            ...this.elementColors,
            ...this.theme.colors[color].elements,
        }));
    }
    isDefaultColor(color) {
        return color === this.defaults.color;
    }
    /**
     * Get color values
     *
     * @param color - The color to use
     * @default color From the defaults
     */
    colors(color) {
        return this.computeFrom(color ??= this.defaults.color);
    }
    compoundColorsCache = new DefaultWeakMap((baseElementColors) => new DefaultMap((depth) => computeCompoundColorValues(baseElementColors, depth)));
    /**
     * Get colors for compound nodes
     *
     * @param baseElementColors - The base element colors to compute from
     */
    colorsForCompounds(baseElementColors, depth) {
        return this.compoundColorsCache.get(baseElementColors).get(depth ?? 6);
    }
    /**
     * Get font size in pixels
     *
     * @param textSize - The text size to use
     * @default textSize From the defaults
     */
    fontSize(textSize) {
        textSize ??= this.defaults.text ?? this.defaults.size;
        return this.theme.textSizes[textSize];
    }
    /**
     * Get padding in pixels
     *
     * @param paddingSize - The padding size to use
     * @default paddingSize From the defaults
     */
    padding(paddingSize) {
        paddingSize ??= this.defaults.padding ?? this.defaults.size;
        return this.theme.spacing[paddingSize];
    }
    /**
     * Get icon size in pixels
     *
     * @param iconSize - The icon size to use
     * @default iconSize From the defaults
     */
    iconSize(iconSize) {
        iconSize ??= this.defaults.size;
        return this.theme.iconSizes[iconSize];
    }
    isThemeColor(color) {
        return color in this.theme.colors;
    }
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
    nodeSizes(nodestyles) {
        const sizes = ensureSizes(nodestyles, this.defaults.size);
        return {
            sizes,
            values: {
                sizes: this.theme.sizes[sizes.size],
                padding: this.padding(sizes.padding),
                textSize: this.fontSize(sizes.textSize),
                iconSize: this.iconSize(sizes.iconSize),
            },
        };
    }
    /**
     * Compute ThemeColorValues from a given color
     * @param color - HEX, RGB, RGBA, etc.
     */
    computeFrom(color) {
        if (this.isThemeColor(color)) {
            return this.theme.colors[color];
        }
        if (!chroma.valid(color)) {
            throw new Error(`Invalid color value: "${color}" (not a theme color and not a valid CSS color)`);
        }
        return computeColorValues(color);
    }
    equals(other) {
        if (other === this) {
            return true;
        }
        // Check if both objects share the same prototype/constructor
        if (this.constructor !== other.constructor) {
            return false;
        }
        return isDeepEqual(this.config, other.config) &&
            isDeepEqual(this.customCss ?? null, other.customCss ?? null);
    }
}
