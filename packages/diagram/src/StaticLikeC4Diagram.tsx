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
  | 'enableElementDetails'
  | 'enableRelationshipDetails'
  | 'enableRelationshipBrowser'
  | 'initialWidth'
  | 'initialHeight'
  | 'renderIcon'
  | 'where'
>

export function StaticLikeC4Diagram({
  view,
  fitView = true,
  fitViewPadding = 0,
  enableElementDetails = false,
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
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
      showDiagramTitle={false}
      showNotations={false}
      enableElementDetails={enableElementDetails}
      enableRelationshipDetails={enableRelationshipDetails}
      enableRelationshipBrowser={enableRelationshipBrowser}
      enableDynamicViewWalkthrough={false}
      experimentalEdgeEditing={false}
      enableFocusMode={false}
      nodesSelectable={false}
      nodesDraggable={false}
      enableSearch={false}
      {...rest}
    />
  )
}
