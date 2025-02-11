import { IfEnabled } from '../context'
import { Overlays } from '../overlays/Overlays'
import { Controls, DiagramTitlePanel, DynamicViewWalkthrough, NotationPanel } from './ui'

export function DiagramUI() {
  return (
    <>
      <Controls />
      <Overlays />
      <IfEnabled feature="ViewTitle">
        <DiagramTitlePanel />
      </IfEnabled>
      <IfEnabled feature="Notations">
        <NotationPanel />
      </IfEnabled>
      <IfEnabled feature="DynamicViewWalkthrough">
        <DynamicViewWalkthrough />
      </IfEnabled>
    </>
  )
}
