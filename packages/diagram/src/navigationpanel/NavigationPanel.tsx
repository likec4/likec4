import { hasProp, isDynamicView } from '@likec4/core/types'
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
import { useOptionalCurrentViewModel } from '../hooks/useCurrentViewModel'
import { selectDiagramContext, useDiagramSelector } from '../hooks/useDiagram'
import { useMantinePortalProps } from '../hooks/useMantinePortalProps'
import type { NavigationPanelActorRef, NavigationPanelActorSnapshot } from './actor'
import { ComparePanel } from './comparepanel'
import { EditorPanel } from './editorpanel'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelControls } from './NavigationPanelControls'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { ActiveWalkthroughControls } from './walkthrough'
import { WalkthroughPanel } from './walkthrough/WalkthroughPanel'

const select = selectDiagramContext(s => {
  const isActiveWalkthrough = !!s.activeWalkthrough
  if (isDynamicView(s.view) && isActiveWalkthrough) {
    const isSequenceView = s.dynamicViewVariant === 'sequence'
    return {
      view: s.view,
      mode: (isSequenceView && hasProp(s.view, 'flow')
        ? 'walkthrough-flow'
        : 'walkthrough') as NavigationPanelMode,
    }
  }
  return {
    view: s.view,
    mode: 'default' as NavigationPanelMode,
  }
})

type NavigationPanelMode =
  | 'default' // Default mode - no walkthrough
  | 'walkthrough-flow' // Walkthrough mode with flow visualization (hide panel)
  | 'walkthrough'

const stateHasActiveTag = (state: NavigationPanelActorSnapshot) => state.hasTag('active')
export const NavigationPanel = memo<{ actorRef: NavigationPanelActorRef }>(({ actorRef }) => {
  const {
    view,
    mode,
  } = useDiagramSelector(select)
  const viewModel = useOptionalCurrentViewModel()
  const opened = useSelector(actorRef, stateHasActiveTag)
  const portalProps = useMantinePortalProps()

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
        {mode !== 'walkthrough-flow' && (
          <>
            <Popover
              offset={{
                mainAxis: 4,
              }}
              opened={opened}
              position="bottom-start"
              trapFocus={opened}
              {...portalProps}
              clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
              onDismiss={() => actorRef.send({ type: 'dropdown.dismiss' })}
            >
              <LayoutGroup>
                <PopoverTarget>
                  <m.div
                    layout
                    layoutDependency={mode}
                    className={hstack({
                      layerStyle: 'likec4.panel',
                      position: 'relative',
                      gap: 'xs',
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      width: '100%',
                    })}
                    onMouseLeave={() => actorRef.send({ type: 'breadcrumbs.mouseLeave' })}
                  >
                    <AnimatePresence propagate initial={false}>
                      {mode === 'walkthrough'
                        ? <ActiveWalkthroughControls />
                        : <NavigationPanelControls />}
                    </AnimatePresence>
                  </m.div>
                </PopoverTarget>
              </LayoutGroup>
              {opened && <NavigationPanelDropdown />}
            </Popover>
            <ComparePanel />
            {mode === 'walkthrough' && <WalkthroughPanel />}
            <EditorPanel />
          </>
        )}
      </NavigationPanelActorContextProvider>
    </VStack>
  )
})
NavigationPanel.displayName = 'NavigationPanel'
