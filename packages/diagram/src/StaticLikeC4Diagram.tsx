import type * as aux from '@likec4/core/types/_aux'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramProperties } from './LikeC4Diagram.props'

export type StaticLikeC4DiagramProps<A extends aux.Any> = Pick<
  LikeC4DiagramProperties<A>,
  | 'view'
  | 'className'
  | 'fitView'
  | 'fitViewPadding'
  | 'background'
  | 'enableElementDetails'
  | 'enableRelationshipDetails'
  | 'enableRelationshipBrowser'
  | 'enableElementTags'
  | 'reduceGraphics'
  | 'initialWidth'
  | 'initialHeight'
  | 'renderIcon'
  | 'renderNodes'
  | 'where'
>

export function StaticLikeC4Diagram<A extends aux.Any = aux.UnknownLayouted>({
  view,
  fitView = true,
  fitViewPadding = '8px',
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
  background = 'transparent',
  ...rest
}: StaticLikeC4DiagramProps<A>) {
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
      enableElementDetails={false}
      enableRelationshipDetails={enableRelationshipDetails}
      enableRelationshipBrowser={enableRelationshipBrowser}
      enableDynamicViewWalkthrough={false}
      showNavigationButtons={false}
      experimentalEdgeEditing={false}
      enableFocusMode={false}
      enableSearch={false}
      nodesSelectable={false}
      nodesDraggable={false}
      enableElementTags={false}
      {...rest}
    />
  )
}
