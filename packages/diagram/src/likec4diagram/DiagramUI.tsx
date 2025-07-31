import { hstack } from '@likec4/styles/patterns'
import { Panel } from '@xyflow/react'
import { memo } from 'react'
import { useEnabledFeatures } from '../context'
import { useDiagram } from '../hooks/useDiagram'
import { useOverlaysActorRef } from '../hooks/useOverlaysActor'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { DynamicViewWalkthrough, NotationPanel } from './ui'

export const DiagramUI = memo(() => {
  const {
    enableViewTitle,
    enableNotations,
    enableDynamicViewWalkthrough,
    enableSearch,
  } = useEnabledFeatures()
  const diagram = useDiagram()

  const overlaysActorRef = useOverlaysActorRef()
  const searchActorRef = useSearchActorRef()

  return (
    <>
      {/* <Controls /> */}
      <Panel
        className={hstack({
          gap: 'sm',
          margin: 'sm',
        })}
      >
        <NavigationPanel />
        {
          /* {enableSearch && (
          <SearchControl
            onClick={e => {
              e.stopPropagation()
              diagram.openSearch()
            }}
          />
        )} */
        }
      </Panel>
      {overlaysActorRef && <Overlays overlaysActorRef={overlaysActorRef} />}
      {/* {enableViewTitle && <DiagramTitlePanel />} */}
      {enableNotations && <NotationPanel />}
      {enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {enableSearch && searchActorRef && <Search searchActorRef={searchActorRef} />}
    </>
  )
})
DiagramUI.displayName = 'DiagramUI'
