import { memo } from 'react'
import { useEnabledFeatures } from '../context'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { EnsureCurrentViewModel } from '../likec4model/LikeC4ModelContext'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export const DiagramUI = memo(() => {
  const {
    enableControls,
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
    enableSearch,
    enableRelationshipDetails,
  } = useEnabledFeatures()
  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  return (
    <>
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
    </>
  )
})
DiagramUI.displayName = 'DiagramUI'
