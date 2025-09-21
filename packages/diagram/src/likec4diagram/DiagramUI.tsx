import { useRerender } from '@react-hookz/web'
import { memo } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context'
import { EnsureCurrentViewModel } from '../context/LikeC4ModelContext'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export const LikeC4DiagramUI = memo(() => {
  const {
    enableControls,
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
    enableSearch,
    enableRelationshipDetails,
  } = useEnabledFeatures()
  const rerender = useRerender()
  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  return (
    <ErrorBoundary onReset={rerender}>
      {enableControls === 'next'
        ? (
          <EnsureCurrentViewModel>
            <NavigationPanel />
          </EnsureCurrentViewModel>
        )
        : <Controls />}
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableNotations && <NotationPanel />}
      {enableControls === true && (
        <>
          {enableViewTitle && <DiagramTitlePanel />}
          {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
        </>
      )}
      {enableSearch && searchActorRef && <Search searchActorRef={searchActorRef} />}
      {enableRelationshipDetails && <RelationshipPopover />}
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
