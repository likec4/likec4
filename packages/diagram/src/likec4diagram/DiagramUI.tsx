import { useEnabledFeatures } from '../context'
import { useDiagramActorSnapshot } from '../hooks/useDiagram'
import { Overlays } from '../overlays/Overlays'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export function DiagramUI() {
  const {
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
  } = useEnabledFeatures()

  const overlaysActorRef = useDiagramActorSnapshot(s => s.children.overlays)

  return (
    <>
      <Controls />
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {enableViewTitle && <DiagramTitlePanel />}
      {enableNotations && <NotationPanel />}
      {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
    </>
  )
}
