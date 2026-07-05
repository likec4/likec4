import { isDynamicView } from '@likec4/core'
import { useRerender } from '@react-hookz/web'
import { memo } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useCallbackRef } from '../hooks'
import { selectDiagramActor, useDiagramSnapshot } from '../hooks/useDiagram'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { LayoutDriftFrame, NotationPanel, SequenceActorsPanel } from './ui'

const selectChildren = selectDiagramActor(s => ({
  overlays: s.children.overlays ?? null,
  search: s.children.search ?? null,
  isSequenceView: isDynamicView(s.context.view) && s.context.dynamicViewVariant === 'sequence',
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
  const { isSequenceView, ...actors } = useDiagramSnapshot(selectChildren)

  const handleReset = useCallbackRef(() => {
    console.warn('DiagramUI: resetting error boundary and rerendering...')
    rerender()
  })

  return (
    <ErrorBoundary onReset={handleReset}>
      {isSequenceView && <SequenceActorsPanel />}
      {enableControls && <NavigationPanel />}
      {actors.overlays && <Overlays overlaysActorRef={actors.overlays} />}
      {enableNotations && <NotationPanel />}
      {enableSearch && actors.search && <Search searchActorRef={actors.search} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
      {enableCompareWithLatest && <LayoutDriftFrame />}
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
