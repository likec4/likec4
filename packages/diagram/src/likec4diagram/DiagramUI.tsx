import { memo } from 'react'
import { useEnabledFeatures } from '../context'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { Overlays } from '../overlays/Overlays'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export const DiagramUI = memo(() => {
  const {
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
  } = useEnabledFeatures()

  const overlaysActorRef = useOverlaysActorRef()

  return (
    <>
      <Controls />
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableViewTitle && <DiagramTitlePanel />}
      {enableNotations && <NotationPanel />}
      {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
    </>
  )
})
DiagramUI.displayName = 'DiagramUI'
