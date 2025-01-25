import { memo } from 'react'
import { IfEnabled } from '../context'
import { LikeC4Search } from '../LikeC4Search'
import { Overlays } from '../overlays/Overlays'
import { Controls, DiagramTitlePanel } from './ui'
import NotationPanel from './ui/notation'
import { DynamicViewWalkthrough } from './ui/walkthrough/DynamicViewWalkthrough'

export const DiagramUI = memo(() => {
  return (
    <>
      <Controls />
      <Overlays />
      <IfEnabled feature="Search">
        <LikeC4Search />
      </IfEnabled>
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
})
