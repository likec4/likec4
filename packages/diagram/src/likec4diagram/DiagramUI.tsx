import { useRerender } from '@react-hookz/web'
import { memo, useCallback } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { LayoutDriftFrame, NotationPanel } from './ui'

export const LikeC4DiagramUI = memo(() => {
  const {
    enableControls,
    enableNotations,
    enableSearch,
    enableRelationshipDetails,
    enableReadOnly,
    enableCompareWithLatest,
  } = useEnabledFeatures()
  const rerender = useRerender()
  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  const handleReset = useCallback(() => {
    console.warn('DiagramUI: resetting error boundary and rerendering...')
    rerender()
  }, [])

  return (
    <ErrorBoundary onReset={handleReset}>
      {enableControls && <NavigationPanel />}
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableNotations && <NotationPanel />}
      {enableSearch && searchActorRef && <Search searchActorRef={searchActorRef} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
      {enableCompareWithLatest && <LayoutDriftFrame />}
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
