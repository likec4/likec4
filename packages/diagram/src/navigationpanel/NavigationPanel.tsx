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
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useOptionalCurrentViewModel } from '../hooks/useCurrentViewModel'
import { selectDiagramContext, useDiagramSelector } from '../hooks/useDiagram'
import { useMantinePortalProps } from '../hooks/useMantinePortalProps'
import type { NavigationPanelActorRef, NavigationPanelActorSnapshot } from './actor'
import { ComparePanel } from './comparepanel'
import { EditorPanel } from './editorpanel'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelControls } from './NavigationPanelControls'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { ActiveWalkthroughControls, StoryControls } from './walkthrough'
import { WalkthroughPanel } from './walkthrough/WalkthroughPanel'

export const select = selectDiagramContext(s => {
  const isActiveWalkthrough = !!s.activeWalkthrough
  if (isDynamicView(s.view) && isActiveWalkthrough) {
    const isSequenceView = s.dynamicViewVariant === 'sequence'
    if (isSequenceView && hasProp(s.view, 'flow')) {
      return {
        view: s.view,
        story: s.story,
        mode: 'walkthrough-flow' as NavigationPanelMode,
      }
    }
    return {
      view: s.view,
      story: s.story,
      // A dynamic view's own step-through walkthrough can be entered while
      // that view is also being shown as a story scene. The two are
      // orthogonal — the walkthrough steps edges within the view, the story
      // steps scenes across views — so neither should hide the other: this
      // mode renders `ActiveWalkthroughControls` and `StoryControls`
      // side by side instead of the walkthrough replacing the story's
      // scene-stepping controls.
      mode: (s.story != null ? 'walkthrough-in-story' : 'walkthrough') as NavigationPanelMode,
    }
  }
  return {
    view: s.view,
    story: s.story,
    mode: 'default' as NavigationPanelMode,
  }
})

export type NavigationPanelMode =
  | 'default' // Default mode - no walkthrough
  | 'walkthrough-flow' // Walkthrough mode with flow visualization (hide panel)
  | 'walkthrough'
  | 'walkthrough-in-story' // Dynamic-view walkthrough active while inside a story scene: both controls render together

/**
 * `select` is a pure XState selector with no access to `DiagramFeatures`'s React context, so
 * the `enableStoryWalkthrough` gate can't be folded into it directly. This downgrades the raw
 * `'walkthrough-in-story'` mode to plain `'walkthrough'` — the pre-Task-5 behavior
 * (dynamic-view-only controls, no `StoryControls`) — whenever the consumer hasn't explicitly
 * opted into `enableStoryWalkthrough`. Every other mode passes through unchanged. This mirrors
 * the gate `NavigationPanelControls` already applies to its own (non-walkthrough)
 * `StoryControls`.
 */
export const resolveMode = (
  selectedMode: NavigationPanelMode,
  enableStoryWalkthrough: boolean,
): NavigationPanelMode => {
  if (selectedMode === 'walkthrough-in-story' && !enableStoryWalkthrough) {
    return 'walkthrough'
  }
  return selectedMode
}

const stateHasActiveTag = (state: NavigationPanelActorSnapshot) => state.hasTag('active')
export const NavigationPanel = memo<{ actorRef: NavigationPanelActorRef }>(({ actorRef }) => {
  const {
    view,
    story,
    mode: selectedMode,
  } = useDiagramSelector(select)
  const { enableStoryWalkthrough } = useEnabledFeatures()
  const mode = resolveMode(selectedMode, enableStoryWalkthrough)
  const viewModel = useOptionalCurrentViewModel()
  const opened = useSelector(actorRef, stateHasActiveTag)
  const portalProps = useMantinePortalProps()

  useEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { viewModel, view, story } })
  }, [actorRef, viewModel, view, story])

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
                        : mode === 'walkthrough-in-story'
                        ? (
                          <>
                            <ActiveWalkthroughControls />
                            <StoryControls key="story-controls" />
                          </>
                        )
                        : <NavigationPanelControls />}
                    </AnimatePresence>
                  </m.div>
                </PopoverTarget>
              </LayoutGroup>
              {opened && <NavigationPanelDropdown />}
            </Popover>
            <ComparePanel />
            {(mode === 'walkthrough' || mode === 'walkthrough-in-story') && <WalkthroughPanel />}
            <EditorPanel />
          </>
        )}
      </NavigationPanelActorContextProvider>
    </VStack>
  )
})
NavigationPanel.displayName = 'NavigationPanel'
