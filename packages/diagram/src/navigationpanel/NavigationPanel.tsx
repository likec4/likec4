import { getViewFolderPath } from '@likec4/core/model'
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
import { NavigationPanel as StyledNavigationPanel } from '../components/NavigationPanel'
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
  const viewFolder = getViewFolderPath(s.view.title ?? '') ?? ''
  if (isDynamicView(s.view) && isActiveWalkthrough) {
    const isSequenceView = s.dynamicViewVariant === 'sequence'
    return {
      viewId: s.view.id,
      viewFolder,
      mode: (isSequenceView && hasProp(s.view, 'flow')
        ? 'walkthrough-flow'
        : 'walkthrough') as NavigationPanelMode,
    }
  }
  return {
    viewId: s.view.id,
    viewFolder,
    mode: 'default' as NavigationPanelMode,
  }
})

type NavigationPanelMode =
  | 'default' // Default mode - no walkthrough
  | 'walkthrough-flow' // Walkthrough mode with flow visualization (hide panel)
  | 'walkthrough'

const stateHasActiveTag = (state: NavigationPanelActorSnapshot) => state.hasTag('active')
export const NavigationPanel = memo<{
  actorRef: NavigationPanelActorRef
  isComparing: boolean
}>(({ actorRef, isComparing }) => {
  const opened = useSelector(actorRef, stateHasActiveTag)
  const portalProps = useMantinePortalProps()

  const { viewId, mode, viewFolder } = useDiagramSelector(select)

  useEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { viewId, viewFolder } })
  }, [actorRef, viewId, viewFolder])

  return (
    <StyledNavigationPanel.Root>
      <NavigationPanelActorContextProvider value={actorRef}>
        {mode !== 'walkthrough-flow' && (
          <>
            <LayoutGroup>
              <AnimatePresence propagate initial={false}>
                <Popover
                  offset={{
                    mainAxis: 4,
                  }}
                  opened={opened}
                  position="bottom-start"
                  trapFocus={opened}
                  keepMounted={false}
                  {...portalProps}
                  clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
                  onDismiss={() => actorRef.send({ type: 'dropdown.dismiss' })}
                >
                  <PopoverTarget>
                    <StyledNavigationPanel.Body
                      layout="size"
                      layoutDependency={`mode-${mode}-viewId-${viewId}`}
                      data-panel="navigation"
                      onMouseLeave={() => actorRef.send({ type: 'breadcrumbs.mouseLeave' })}
                    >
                      {mode === 'walkthrough'
                        ? <ActiveWalkthroughControls />
                        : <NavigationPanelControls />}
                    </StyledNavigationPanel.Body>
                  </PopoverTarget>
                  <NavigationPanelDropdown />
                </Popover>
              </AnimatePresence>
            </LayoutGroup>
            {mode === 'walkthrough' && <WalkthroughPanel />}
            {isComparing && <ComparePanel />}
            <EditorPanel />
          </>
        )}
      </NavigationPanelActorContextProvider>
    </StyledNavigationPanel.Root>
  )
})
NavigationPanel.displayName = 'NavigationPanel'
