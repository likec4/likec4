import { hasProp, isDynamicView } from '@likec4/core'
import { useRerender } from '@react-hookz/web'
import { useCallback } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramSnapshot, useDiagramSelector } from '../hooks'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { isComparingLayouts } from './state/machine.setup'
import { FloatingSequenceActors, NotationPanel, SequenceOutlinePanel } from './ui'

const selectChildren = selectDiagramSnapshot(s => ({
  overlays: s.children.overlays ?? null,
  search: s.children.search ?? null,
  navigation: s.children.navigationPanel ?? null,
  isComparing: isComparingLayouts(s),
  ...(isDynamicView(s.context.view) ?
    {
      isSequenceView: s.context.dynamicViewVariant === 'sequence',
      isActiveWalkthrough: s.context.dynamicViewVariant === 'sequence'
        && !!s.context.activeWalkthrough
        && hasProp(s.context.view, 'flow'),
    } :
    {
      isSequenceView: false,
      hasSequenceFlow: false,
      isActiveWalkthrough: false,
    }),
}))

export function LikeC4DiagramUI() {
  const {
    enableControls,
    enableNotations,
    enableSearch,
    enableRelationshipDetails,
    enableReadOnly,
  } = useEnabledFeatures()
  const rerender = useRerender()
  const { isSequenceView, isActiveWalkthrough, isComparing, ...actors } = useDiagramSelector(selectChildren)

  const handleReset = useCallback(() => {
    if (import.meta.env.DEV) {
      console.warn('DiagramUI: resetting error boundary and rerendering...')
    }
    rerender()
  }, [])

  return (
    <ErrorBoundary onReset={handleReset}>
      {isSequenceView && <FloatingSequenceActors isActiveWalkthrough={isActiveWalkthrough} />}
      {isActiveWalkthrough && <SequenceOutlinePanel />}
      {(
        enableControls &&
        actors.navigation &&
        !isActiveWalkthrough
      ) && <NavigationPanel actorRef={actors.navigation} isComparing={isComparing} />}
      {actors.overlays && <Overlays overlaysActorRef={actors.overlays} />}
      {enableNotations && <NotationPanel />}
      {enableSearch && actors.search && <Search searchActorRef={actors.search} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
    </ErrorBoundary>
  )
}
