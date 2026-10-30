import { LikeC4Styles } from '@likec4/core/styles'
import type { ProcessedView } from '@likec4/core/types'

/**
 * Fills in the color and line that every computed edge carries and the shared mock views omit,
 * so generators that style edges can run on them.
 */
export function withEdgeStyles($view: ProcessedView): ProcessedView {
  const { color, line } = LikeC4Styles.DEFAULT.defaults.relationship
  return {
    ...$view,
    edges: $view.edges.map(edge => ({ ...edge, color: edge.color ?? color, line: edge.line ?? line })),
  } as ProcessedView
}

/**
 * The `$model` part of a mocked view model that generators read styles from.
 */
export const mockModelStyles = { $styles: LikeC4Styles.DEFAULT }
