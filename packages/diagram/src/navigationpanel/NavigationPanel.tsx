import { hstack } from '@likec4/styles/patterns'
import {
  Popover,
  PopoverTarget,
} from '@mantine/core'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useEffect } from 'react'
import { useDiagramActorRef } from '../hooks/safeContext'
import { useDiagramContext } from '../hooks/useDiagram'
import { useCurrentViewModel } from '../likec4model/useCurrentViewModel'
import { type NavigationPanelActorRef, navigationPanelActorLogic } from './actor'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelControls } from './NavigationPanelControls'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { ActiveWalkthroughControls } from './walkthrough'

export const NavigationPanel = memo(() => {
  const diagramActor = useDiagramActorRef()
  const viewModel = useCurrentViewModel()

  const actorRef = useActorRef(
    navigationPanelActorLogic,
    {
      input: {
        viewModel,
      },
    },
  )
  useEffect(() => {
    const subscription = actorRef.on('trigger.navigateTo', (event) => {
      if (diagramActor.getSnapshot().context.view.id !== event.viewId) {
        diagramActor.send({ type: 'navigate.to', viewId: event.viewId })
      }
    })
    return () => subscription.unsubscribe()
  }, [actorRef, diagramActor])

  useUpdateEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { viewModel } })
  }, [viewModel])

  return (
    <NavigationPanelActorContextProvider value={actorRef}>
      <NavigationPanelImpl actor={actorRef} />
    </NavigationPanelActorContextProvider>
  )
})
NavigationPanel.displayName = 'DiagramBreadcrumbs'

const NavigationPanelImpl = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const opened = useSelector(actor, s => s.hasTag('active'))
  // const portalProps = useMantinePortalProps()

  return (
    <Popover
      offset={{
        mainAxis: 4,
      }}
      middlewares={{ flip: false }}
      opened={opened}
      shadow="md"
      position="bottom-start"
      trapFocus
      withinPortal={false}
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onDismiss={() => actor.send({ type: 'dropdown.dismiss' })}
    >
      <NavigationPanelPopoverTarget actor={actor} />
      <NavigationPanelDropdown />
    </Popover>
  )
}
const NavigationPanelPopoverTarget = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const isActiveWalkthrough = useDiagramContext(c => c.activeWalkthrough !== null)

  return (
    <LayoutGroup>
      <PopoverTarget>
        <m.div
          layout
          initial={false}
          className={hstack({
            layerStyle: 'likec4.panel',
            position: 'relative',
            gap: 'xs',
            cursor: 'pointer',
            paddingRight: 'md',
          })}
          onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
        >
          <AnimatePresence>
            {isActiveWalkthrough ? <ActiveWalkthroughControls /> : <NavigationPanelControls />}
          </AnimatePresence>
        </m.div>
      </PopoverTarget>
    </LayoutGroup>
  )
}
