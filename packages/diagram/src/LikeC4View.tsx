import { LikeC4Diagram } from './LikeC4Diagram'
import { type LikeC4ViewProps } from './props'

export function LikeC4View({
  view,
  fitView = true,
  fitViewPadding = 0,
  ...apiProps
}: LikeC4ViewProps) {
  return (
    <LikeC4Diagram
      view={view}
      readonly
      fitView={fitView}
      fitViewPadding={fitViewPadding}
      pannable={false}
      zoomable={false}
      controls={false}
      disableBackground
      disableHovercards
      nodesSelectable={false}
      {...apiProps}
    />
  )
}
