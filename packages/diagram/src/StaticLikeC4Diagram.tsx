import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramProperties } from './LikeC4Diagram.props'

export type StaticLikeC4DiagramProps = Pick<
  LikeC4DiagramProperties,
  | 'view'
  | 'keepAspectRatio'
  | 'className'
  | 'fitView'
  | 'fitViewPadding'
  | 'background'
  | 'initialWidth'
  | 'initialHeight'
  | 'renderIcon'
>

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
      showElementLinks
      showDiagramTitle={false}
      enableDynamicViewWalkthrough={false}
      enableFocusMode={false}
      nodesSelectable={false}
      nodesDraggable={false}
      {...rest}
    />
  )
}
