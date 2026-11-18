/**
 * Default font family of the diagram (CSS font-family value)
 */
export const DefaultFontFamily =
  `'IBM Plex Sans Variable',ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`

/**
 * Metrics of the relationship (edge) label, in px.
 *
 * Single source of truth for the CSS of the label (recipes `edgeLabel` and `edgeActionBtn`)
 * and for layouts, that measure labels to reserve space for them
 * (`@likec4/layouts` and overlays of `@likec4/diagram`).
 */
export const EdgeLabelMetrics = {
  label: {
    fontSize: 14,
    lineHeight: 1.2,
    /**
     * Longer labels are truncated
     */
    maxLines: 5,
  },
  technology: {
    fontSize: 11,
    lineHeight: 1,
  },
  /**
   * Gap between label, technology and action button
   */
  gap: 2,
  paddingBlock: 4,
  paddingInline: 6,
  /**
   * Size of the action button (e.g. navigate to)
   */
  actionButtonSize: 28,
  /**
   * Layouts wrap labels to lines not wider than this (without paddings)
   */
  maxTextWidth: 220,
} as const
