import { memo } from 'react'
import { useEnabledFeatures } from '../context'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export const DiagramUI = memo(() => {
  const {
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
    enableSearch,
  } = useEnabledFeatures()

  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  return (
    <>
      <Controls />
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableViewTitle && <DiagramTitlePanel />}
      {enableNotations && <NotationPanel />}
      {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {enableSearch && searchActorRef && <Search searchActorRef={searchActorRef} />}
    </>
  )
})
DiagramUI.displayName = 'DiagramUI'
