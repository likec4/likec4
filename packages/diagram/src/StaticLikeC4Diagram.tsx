import type { Any, UnknownLayouted } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramProperties } from './LikeC4Diagram.props'

export type StaticLikeC4DiagramProps<A extends Any> = Pick<
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

export function StaticLikeC4Diagram<A extends Any = UnknownLayouted>({
  view,
  fitView = true,
  fitViewPadding = '8px',
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
  background = 'transparent',
  className,
  ...rest
}: StaticLikeC4DiagramProps<A>) {
  return (
    <LikeC4Diagram
      view={view}
      readonly
      className={cx(className, 'likec4-static-view')}
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
