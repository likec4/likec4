import { VStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  Popover,
  PopoverTarget,
} from '@mantine/core'
import { useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useEffect } from 'react'
import { useDiagram } from '../hooks/safeContext'
import { useCurrentView } from '../hooks/useCurrentView'
import { useOptionalCurrentViewModel } from '../hooks/useCurrentViewModel'
import { selectDiagramContext, useDiagramState } from '../hooks/useDiagram'
import { useMantinePortalProps } from '../hooks/useMantinePortalProps'
import type { NavigationPanelActorRef, NavigationPanelActorSnapshot } from './actor'
import { ComparePanel } from './comparepanel'
import { EditorPanel } from './editorpanel'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelControls } from './NavigationPanelControls'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { ActiveWalkthroughControls } from './walkthrough'
import { WalkthroughPanel } from './walkthrough/WalkthroughPanel'

export const NavigationPanel = memo<{ actorRef: NavigationPanelActorRef }>(({ actorRef }) => {
  const diagram = useDiagram()
  const view = useCurrentView()
  const viewModel = useOptionalCurrentViewModel()

  useEffect(() => {
    const subscription = actorRef.on('navigateTo', (event) => {
      diagram.navigateTo(event.viewId)
    })
    return () => subscription.unsubscribe()
  }, [actorRef, diagram])

  useEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { viewModel, view } })
  }, [actorRef, viewModel, view])

  return (
    <VStack
      css={{
        alignItems: 'flex-start',
        pointerEvents: 'none',
        position: 'absolute',
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
        _print: {
          display: 'none',
        },
      }}>
      <NavigationPanelActorContextProvider value={actorRef}>
        <NavigationPanelImpl actor={actorRef} />
        <ComparePanel />
        <WalkthroughPanel />
        <EditorPanel />
      </NavigationPanelActorContextProvider>
    </VStack>
  )
})
NavigationPanel.displayName = 'NavigationPanel'

const stateHasActiveTag = (state: NavigationPanelActorSnapshot) => state.hasTag('active')
const NavigationPanelImpl = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const opened = useSelector(actor, stateHasActiveTag)
  const portalProps = useMantinePortalProps()

  return (
    <Popover
      offset={{
        mainAxis: 4,
      }}
      opened={opened}
      position="bottom-start"
      trapFocus={opened}
      {...portalProps}
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onDismiss={() => actor.send({ type: 'dropdown.dismiss' })}
    >
      <NavigationPanelPopoverTarget actor={actor} />
      {opened && <NavigationPanelDropdown />}
    </Popover>
  )
}

const selectIsActiveWalkthrough = selectDiagramContext(c => c.activeWalkthrough !== null)
const NavigationPanelPopoverTarget = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const isActiveWalkthrough = useDiagramState(selectIsActiveWalkthrough)

  return (
    <LayoutGroup>
      <PopoverTarget>
        <m.div
          layout
          layoutDependency={isActiveWalkthrough}
          className={hstack({
            layerStyle: 'likec4.panel',
            position: 'relative',
            gap: 'xs',
            cursor: 'pointer',
            pointerEvents: 'all',
            width: '100%',
          })}
          onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
        >
          <AnimatePresence propagate>
            {isActiveWalkthrough ? <ActiveWalkthroughControls /> : <NavigationPanelControls />}
          </AnimatePresence>
        </m.div>
      </PopoverTarget>
    </LayoutGroup>
  )
}
