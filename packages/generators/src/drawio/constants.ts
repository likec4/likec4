/**
 * DrawIO protocol and layout constants. Single source of truth so export/parse
 * stay in sync and magic numbers are named for readability.
 */

/** Draw.io internal page link prefix; cell link becomes "data:page/id,likec4-<viewId>". */
export const DRAWIO_PAGE_LINK_PREFIX = 'data:page/id,likec4-'

/** Diagram (tab) id inside mxfile; we use "likec4-<viewId>" so Draw.io opens the correct tab. */
export const DRAWIO_DIAGRAM_ID_PREFIX = 'likec4-'

/** Fixed canvas size so the diagram opens centered in Draw.io (layout bounds often equal content). */
export const DEFAULT_CANVAS_WIDTH = 800
export const DEFAULT_CANVAS_HEIGHT = 600

/** Default node bbox when layout has no position (used to detect "unlaid" nodes for spread/wrap). */
export const DEFAULT_NODE_WIDTH = 120
export const DEFAULT_NODE_HEIGHT = 60

/** Vertical gap when spreading multiple nodes that share the same default bbox. */
export const NODES_SPREAD_GAP = 24

/** First id assigned to container title cells (incremented per container). */
export const CONTAINER_TITLE_CELL_ID_START = 10000

/** Container title text cell: min/max width (px), approximate width per character, height, inset from container edge. */
export const CONTAINER_TITLE_MIN_WIDTH_PX = 60
export const CONTAINER_TITLE_MAX_WIDTH_PX = 260
export const CONTAINER_TITLE_CHAR_WIDTH_PX = 8
export const CONTAINER_TITLE_HEIGHT_PX = 18
export const CONTAINER_TITLE_INSET_X = 8
export const CONTAINER_TITLE_INSET_Y = 8

/** Max height (px) for container title area when matching title cell to container (parse). */
export const CONTAINER_TITLE_AREA_MAX_HEIGHT_PX = 40
/** Ratio of container height used for title area when matching (parse). */
export const CONTAINER_TITLE_AREA_HEIGHT_RATIO = 0.5
/** Tolerance (px) for title cell position inside container bounds (parse). */
export const CONTAINER_TITLE_AREA_TOLERANCE = 2

/** Default node fill/stroke/font when no theme color (hex). */
export const DEFAULT_NODE_FILL_HEX = '#dae8fc'
export const DEFAULT_NODE_STROKE_HEX = '#2563eb'
export const DEFAULT_NODE_FONT_HEX = '#1e40af'

/** mxGraphModel page dimensions (draw.io default A4-like). */
export const MXGRAPH_PAGE_WIDTH = 827
export const MXGRAPH_PAGE_HEIGHT = 1169
