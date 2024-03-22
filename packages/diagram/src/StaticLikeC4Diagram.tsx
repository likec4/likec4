import type { DiagramView } from '@likec4/core'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4ColorMode, LikeC4DiagramProperties } from './LikeC4Diagram.props'

export interface StaticLikeC4DiagramProps {
  view: DiagramView

  /**
   * Controls color scheme used for styling the flow
   * By default inherits from system or surrounding MantineProvider
   *
   * @example 'light' | 'dark'
   */
  colorMode?: LikeC4ColorMode | undefined
  /**
   * If set, initial viewport will show all nodes & edges
   * @default true
   */
  fitView?: boolean | undefined

  /**
   * Seems like this is percentage of the view size
   * @default 0
   */
  fitViewPadding?: number | undefined

  /**
   * @default 'transparent'
   */
  background?: LikeC4DiagramProperties['background']
}

export function StaticLikeC4Diagram({
  view,
  fitView = true,
  fitViewPadding = 0,
  background = 'transparent',
  ...rest
}: StaticLikeC4DiagramProps) {
  return (
    <LikeC4Diagram
      view={view}
      readonly
      fitView={fitView}
      fitViewPadding={fitViewPadding}
      pannable={false}
      zoomable={false}
      controls={false}
      background={background}
      disableHovercards
      nodesSelectable={false}
      {...rest}
    />
  )
}
