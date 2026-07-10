import { isDynamicView } from '@likec4/core'
import { useRerender } from '@react-hookz/web'
import { memo, useCallback } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramActor, useDiagramSnapshot } from '../hooks/useDiagram'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { LayoutDriftFrame, NotationPanel, SequenceActorsPanel, SequenceOutlinePanel } from './ui'

const selectChildren = selectDiagramActor(s => ({
  overlays: s.children.overlays ?? null,
  search: s.children.search ?? null,
  navigation: s.children.navigationPanel ?? null,
  isSequenceView: isDynamicView(s.context.view) && s.context.dynamicViewVariant === 'sequence',
  isActiveWalkthrough: s.matches({
    ready: 'walkthrough',
  }),
}))

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
  const { isSequenceView, isActiveWalkthrough, ...actors } = useDiagramSnapshot(selectChildren)

  const handleReset = useCallback(() => {
    if (import.meta.env.DEV) {
      console.warn('DiagramUI: resetting error boundary and rerendering...')
    }
    rerender()
  }, [])

  return (
    <ErrorBoundary onReset={handleReset}>
      {isSequenceView && <SequenceActorsPanel />}
      {isSequenceView && isActiveWalkthrough && <SequenceOutlinePanel />}
      {enableControls && actors.navigation && <NavigationPanel actorRef={actors.navigation} />}
      {actors.overlays && <Overlays overlaysActorRef={actors.overlays} />}
      {enableNotations && <NotationPanel />}
      {enableSearch && actors.search && <Search searchActorRef={actors.search} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
      {enableCompareWithLatest && <LayoutDriftFrame />}
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
