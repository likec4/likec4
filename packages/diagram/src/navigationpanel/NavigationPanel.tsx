import { VStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  Popover,
  PopoverTarget,
  Portal,
} from '@mantine/core'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useEffect } from 'react'
import { useDiagramActorRef } from '../hooks/safeContext'
import { useDiagramContext } from '../hooks/useDiagram'
import { useMantinePortalProps } from '../hooks/useMantinePortalProps'
import { useCurrentViewModel } from '../likec4model/useCurrentViewModel'
import { type NavigationPanelActorRef, navigationPanelActorLogic } from './actor'
import { EditorPanel } from './editorpanel'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelControls } from './NavigationPanelControls'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { ActiveWalkthroughControls } from './walkthrough'
import { WalkthroughPanel } from './walkthrough/WalkthroughPanel'

export const NavigationPanel = memo(() => {
  const diagramActor = useDiagramActorRef()
  const viewModel = useCurrentViewModel()
  const { portalProps } = useMantinePortalProps()

  const actorRef = useActorRef(
    navigationPanelActorLogic,
    {
      input: {
        viewModel,
      },
    },
  )
  useEffect(() => {
    const subscription = actorRef.on('navigateTo', (event) => {
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
    <Portal {...portalProps}>
      <VStack
        className="react-flow__panel"
        css={{
          alignItems: 'flex-start',
          pointerEvents: 'none',

          top: '0',
          left: '0',
          margin: '0',
          width: '100%',
          gap: 'xxs',
          maxWidth: [
            'calc(100vw)',
            'calc(100cqw)',
          ],
          '@/sm': {
            margin: 'xs',
            gap: 'xs',
            width: 'max-content',
            maxWidth: [
              'calc(100vw - 2 * {spacing.md})',
              'calc(100cqw - 2 * {spacing.md})',
            ],
          },
        }}>
        <NavigationPanelActorContextProvider value={actorRef}>
          <NavigationPanelImpl actor={actorRef} />
          <EditorPanel />
          <WalkthroughPanel />
        </NavigationPanelActorContextProvider>
      </VStack>
    </Portal>
  )
})
NavigationPanel.displayName = 'NavigationPanel'

const NavigationPanelImpl = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const opened = useSelector(actor, s => s.hasTag('active'))
  const portalProps = useMantinePortalProps()

  return (
    <Popover
      offset={{
        mainAxis: 4,
      }}
      opened={opened}
      position="bottom-start"
      trapFocus
      {...portalProps}
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onDismiss={() => actor.send({ type: 'dropdown.dismiss' })}
    >
      <NavigationPanelPopoverTarget actor={actor} />
      {opened && <NavigationPanelDropdown />}
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
          className={hstack({
            layerStyle: 'likec4.panel',
            position: 'relative',
            gap: 'xs',
            cursor: 'pointer',
            paddingRight: 'md',
            pointerEvents: 'all',
            width: '100%',
          })}
          onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
        >
          <AnimatePresence mode="popLayout">
            {isActiveWalkthrough ? <ActiveWalkthroughControls /> : <NavigationPanelControls />}
          </AnimatePresence>
        </m.div>
      </PopoverTarget>
    </LayoutGroup>
  )
}
