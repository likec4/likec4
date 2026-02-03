import type { Any, UnknownLayouted } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import type { JSX } from 'react/jsx-runtime'
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
  | 'dynamicViewVariant'
  | 'where'
>

/**
 * StaticLikeC4Diagram is a component that renders a LikeC4 diagram in a static way.
 * (Export/Embed)
 *
 * @internal
 */
export function StaticLikeC4Diagram<A extends Any = UnknownLayouted>({
  view,
  fitView = true,
  fitViewPadding = '8px',
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
  background = 'transparent',
  className,
  ...rest
}: StaticLikeC4DiagramProps<A>): JSX.Element {
  return (
    <LikeC4Diagram
      view={view}
      className={cx(className, 'likec4-static-view')}
      fitView={fitView}
      fitViewPadding={fitViewPadding}
      pannable={false}
      zoomable={false}
      controls={false}
      background={background}
      enableNotations={false}
      enableElementDetails={false}
      enableRelationshipDetails={enableRelationshipDetails}
      enableRelationshipBrowser={enableRelationshipBrowser}
      enableDynamicViewWalkthrough={false}
      showNavigationButtons={false}
      enableCompareWithLatest={false}
      enableFocusMode={false}
      enableSearch={false}
      nodesSelectable={false}
      enableElementTags={false}
      {...rest}
    />
  )
}
