import chroma from 'chroma-js'
import { defu } from 'defu'
import { isDeepEqual, isEmptyish } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import type {
  ComputedNodeStyle,
  LikeC4ProjectStylesConfig,
  LikeC4ProjectStylesCustomStylesheets,
  NTuple,
} from '../types'
import { ensureSizes } from '../types'
import { DefaultMap, DefaultWeakMap, memoizeProp } from '../utils'
import { computeColorValues } from './compute-color-values'
import { computeCompoundColorValues } from './compute-compound-colors'
import { styleDefaults } from './defaults'
import { defaultTheme } from './theme'
import type {
  ColorLiteral,
  CustomColorDefinitions,
  ElementColorValues,
  IconSize,
  LikeC4StyleDefaults,
  LikeC4StylesConfig,
  LikeC4Theme,
  RelationshipColorValues,
  SpacingSize,
  TextSize,
  ThemeColor,
  ThemeColorValues,
} from './types'

export const defaultStyle: LikeC4StylesConfig = {
  theme: defaultTheme,
  defaults: styleDefaults,
}

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
  public readonly theme: LikeC4Theme
  public readonly defaults: LikeC4StyleDefaults

  public static readonly DEFAULT: LikeC4Styles = new LikeC4Styles(defaultStyle)

  static from(
    stylesConfig: LikeC4ProjectStylesConfig | undefined,
    customColors?: CustomColorDefinitions | undefined,
  ) {
    if (!stylesConfig && !customColors) {
      return this.DEFAULT
    }
    const { customCss, theme, defaults } = { ...stylesConfig }
    const mergedConfig = defu(
      { theme },
      { defaults: { ...defaults } as LikeC4StyleDefaults },
      { theme: { colors: { ...customColors } } } satisfies LikeC4ProjectStylesConfig,
      defaultStyle,
    )
    if (isEmptyish(customCss?.content) && isDeepEqual(mergedConfig, defaultStyle)) {
      return this.DEFAULT
    }
    return new LikeC4Styles(
      mergedConfig,
      customCss,
    )
  }

  private constructor(
    protected config: LikeC4StylesConfig,
    protected customCss?: LikeC4ProjectStylesCustomStylesheets,
  ) {
    this.theme = config.theme
    this.defaults = config.defaults
  }

  /**
   * Default element colors
   */
  get elementColors(): ElementColorValues {
    return this.theme.colors[this.defaults.color].elements
  }

  /**
   * Default relationship colors
   */
  get relationshipColors(): RelationshipColorValues {
    return this.theme.colors[this.defaults.relationship.color].relationships
  }

  /**
   * Default group colors
   */
  get groupColors(): ElementColorValues {
    const color = this.defaults.group?.color
    if (!color) {
      return this.elementColors
    }
    if (!this.isThemeColor(color)) {
      throw new Error(`Default group color not found in theme: ${color}`)
    }
    return memoizeProp(this, 'defaultGroup', () => ({
      ...this.elementColors,
      ...this.theme.colors[color].elements,
    }))
  }

  isDefaultColor(color: LiteralUnion<ThemeColor, string>): color is ThemeColor {
    return color === this.defaults.color
  }

  /**
   * Get color values
   *
   * @param color - The color to use
   * @default color From the defaults
   */
  colors(color?: LiteralUnion<ThemeColor, string>): ThemeColorValues {
    return this.computeFrom(color ??= this.defaults.color)
  }

  private compoundColorsCache = new DefaultWeakMap((baseElementColors: ElementColorValues) =>
    new DefaultMap((depth: number) => computeCompoundColorValues(baseElementColors, depth))
  )
  /**
   * Get colors for compound nodes
   *
   * @param baseElementColors - The base element colors to compute from
   */
  colorsForCompounds<Depth extends number = 6>(
    baseElementColors: ElementColorValues,
    depth?: Depth,
  ): NTuple<ElementColorValues, Depth> {
    return this.compoundColorsCache.get(baseElementColors).get(depth ?? 6) as NTuple<ElementColorValues, Depth>
  }

  /**
   * Get font size in pixels
   *
   * @param textSize - The text size to use
   * @default textSize From the defaults
   */
  fontSize(textSize?: TextSize): number {
    textSize ??= this.defaults.text ?? this.defaults.size
    return this.theme.textSizes[textSize]
  }

  /**
   * Get padding in pixels
   *
   * @param paddingSize - The padding size to use
   * @default paddingSize From the defaults
   */
  padding(paddingSize?: SpacingSize): number {
    paddingSize ??= this.defaults.padding ?? this.defaults.size
    return this.theme.spacing[paddingSize]
  }

  /**
   * Get icon size in pixels
   *
   * @param iconSize - The icon size to use
   * @default iconSize From the defaults
   */
  iconSize(iconSize?: IconSize): number {
    iconSize ??= this.defaults.size
    return this.theme.iconSizes[iconSize]
  }

  isThemeColor(color: string): color is ThemeColor {
    return color in this.theme.colors
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
  nodeSizes(nodestyles: ComputedNodeStyle) {
    const sizes = ensureSizes(nodestyles, this.defaults.size)
    return {
      sizes,
      values: {
        sizes: this.theme.sizes[sizes.size],
        padding: this.padding(sizes.padding),
        textSize: this.fontSize(sizes.textSize),
        iconSize: this.iconSize(sizes.iconSize),
      },
    }
  }

  /**
   * Compute ThemeColorValues from a given color
   * @param color - HEX, RGB, RGBA, etc.
   */
  computeFrom(color: string): ThemeColorValues {
    if (this.isThemeColor(color)) {
      return this.theme.colors[color]
    }
    if (!chroma.valid(color)) {
      throw new Error(`Invalid color value: "${color}" (not a theme color and not a valid CSS color)`)
    }
    return computeColorValues(color as ColorLiteral)
  }

  equals(other: LikeC4Styles): boolean {
    if (other === this) {
      return true
    }
    // Check if both objects share the same prototype/constructor
    if (this.constructor !== other.constructor) {
      return false
    }
    return isDeepEqual(this.config, other.config) &&
      isDeepEqual(this.customCss ?? null, other.customCss ?? null)
  }
}
