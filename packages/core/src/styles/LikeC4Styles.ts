import chroma from 'chroma-js'
import defu from 'defu'
import { hasAtLeast, isDeepEqual } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import { type ComputedNodeStyle, type LikeC4ProjectStylesConfig, ensureSizes } from '../types'
import { memoizeProp } from '../utils'
import { computeColorValues } from './compute-color-values'
import { styleDefaults } from './defaults'
import { defaultTheme } from './theme'
import type {
  ColorLiteral,
  ElementColorValues,
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

  static from(...configs: Array<LikeC4ProjectStylesConfig | undefined | null>) {
    if (hasAtLeast(configs, 1)) {
      return new LikeC4Styles(
        defu(...configs, defaultStyle) as LikeC4StylesConfig,
      )
    }
    return this.DEFAULT
  }

  private constructor(
    protected config: LikeC4StylesConfig,
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
    color ??= this.defaults.color
    if (this.isThemeColor(color)) {
      return this.theme.colors[color]
    }
    throw new Error(`Unknown color: ${color}`)
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
   *
   * // values
   * values.sizes    // { width: number, height: number }
   * values.padding  // number
   * values.textSize // number
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
    return memoizeProp(this, `compute-${color}`, () => {
      if (!chroma.valid(color)) {
        throw new Error(`Invalid color value: "${color}"`)
      }
      return computeColorValues(color as ColorLiteral)
    })
  }

  equals(other: LikeC4Styles): boolean {
    if (other === this) {
      return true
    }
    return isDeepEqual(this.config, other.config)
  }
}
