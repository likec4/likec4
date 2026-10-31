import type { Size } from './types.ts'

/**
 * Padding of the element node content, either absolute (`px`)
 * or added to the node spacing (`extra`, see `--likec4-spacing`)
 */
export type ElementNodePadding = { px: number } | { extra: number }

export type ElementNodePaddings = {
  top: ElementNodePadding
  right: ElementNodePadding
  bottom: ElementNodePadding
  left: ElementNodePadding
}

const DefaultPaddings: ElementNodePaddings = {
  top: { extra: 0 },
  right: { extra: 8 },
  bottom: { extra: 0 },
  left: { extra: 8 },
}

/**
 * Metrics of the element node content (title, technology, description and icon), in px.
 *
 * Single source of truth for the CSS of the node (recipe `elementNodeData`)
 * and for layouts, that measure the content to size nodes (`@likec4/layouts`).
 */
export const ElementNodeMetrics = {
  title: {
    /**
     * Font size is the node text size (see `textSizes`)
     */
    fontWeight: 500,
    lineHeight: 1.35,
    maxLines: { xs: 2, sm: 2, md: 3, lg: 3, xl: 3 } satisfies Record<Size, number>,
  },
  technology: {
    /**
     * Font size relative to the node text size
     */
    fontSizeRatio: 0.635,
    fontWeight: 400,
    lineHeight: 1.2,
    maxLines: { xs: 0, sm: 0, md: 1, lg: 1, xl: 1 } satisfies Record<Size, number>,
  },
  description: {
    /**
     * Font size relative to the node text size
     */
    fontSizeRatio: 0.74,
    fontWeight: 420,
    lineHeight: 1.2,
    maxLines: { xs: 0, sm: 3, md: 5, lg: 5, xl: 5 } satisfies Record<Size, number>,
    /**
     * Max lines with `sizing: fixed`
     */
    fixedMaxLines: 1,
  },
  /**
   * Gap between title, technology and description
   */
  contentGap: 8,
  /**
   * Gap between title, technology and description, when there are both technology and description
   */
  contentGapDense: 6,
  /**
   * Gap between the icon and the content, when the icon is on the left or right
   */
  iconGapHorizontal: 16,
  /**
   * Gap between the icon and the content, when the icon is on the top or bottom
   */
  iconGapVertical: 8,
  /**
   * Paddings of the content, depending on the shape
   */
  paddings: {
    default: DefaultPaddings,
    queue: { ...DefaultPaddings, left: { px: 46 }, right: { px: 16 } },
    mobile: { ...DefaultPaddings, left: { px: 46 }, right: { px: 16 } },
    cylinder: { ...DefaultPaddings, top: { px: 30 } },
    storage: { ...DefaultPaddings, top: { px: 30 } },
    browser: { ...DefaultPaddings, top: { px: 32 }, bottom: { px: 28 } },
    bucket: { ...DefaultPaddings, left: { extra: 20 }, right: { extra: 20 } },
    component: { ...DefaultPaddings, left: { extra: 30 } },
  } satisfies Record<string, ElementNodePaddings>,
} as const

type ShapeWithPaddings = keyof typeof ElementNodeMetrics.paddings

function hasOwnPaddings(shape: string): shape is ShapeWithPaddings {
  return Object.hasOwn(ElementNodeMetrics.paddings, shape)
}

/**
 * Resolves paddings of the element node content for the given shape and spacing (in px)
 */
export function elementNodePaddings(
  shape: string,
  spacing: number,
): { top: number; right: number; bottom: number; left: number } {
  const paddings = hasOwnPaddings(shape)
    ? ElementNodeMetrics.paddings[shape]
    : ElementNodeMetrics.paddings.default
  const resolve = (p: ElementNodePadding) => 'px' in p ? p.px : spacing + p.extra
  return {
    top: resolve(paddings.top),
    right: resolve(paddings.right),
    bottom: resolve(paddings.bottom),
    left: resolve(paddings.left),
  }
}
