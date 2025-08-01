import { memo } from 'react'
import { useEnabledFeatures } from '../context'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export const DiagramUI = memo(() => {
  const {
    enableControls,
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
    enableSearch,
  } = useEnabledFeatures()

  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  return (
    <>
      {enableControls === 'next' ? <NavigationPanel /> : (enableControls && <Controls />)}
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableNotations && <NotationPanel />}
      {enableControls !== 'next' && (
        <>
          {enableViewTitle && <DiagramTitlePanel />}
          {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
        </>
      )}
      {enableSearch && searchActorRef && <Search searchActorRef={searchActorRef} />}
    </>
  )
})
DiagramUI.displayName = 'DiagramUI'
