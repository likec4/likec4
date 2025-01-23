import {
  type PopoverProps,
  ActionIconGroup,
  Code,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Overlay,
  Stack,
  Text,
  TooltipGroup,
} from '@mantine/core'
import { openSpotlight } from '@mantine/spotlight'
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconFileSymlink,
  IconFocusCentered,
  IconMenu2,
  IconSearch,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, LayoutGroup, m } from 'framer-motion'
import { isNullish } from 'remeda'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import { mantine } from '../../theme-vars'
import { ActionIcon, Tooltip } from './_shared'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import * as css from './styles.css'

const historySelector = (s: DiagramState) => ({
  showBurgerMenu: !!s.onBurgerMenuClick,
  hasStepBack: s.showNavigationButtons && !!s.onNavigateTo && s.navigationHistoryIndex > 0,
  hasStepForward: s.showNavigationButtons && !!s.onNavigateTo
    && s.navigationHistoryIndex < s.navigationHistory.length - 1,
})

const BackwardForwardButtons = () => {
  const store = useDiagramStoreApi()
  const {
    showBurgerMenu,
    hasStepBack,
    hasStepForward,
  } = useDiagramState(historySelector)
  return (
    <LayoutGroup>
      <Group
        className={clsx(css.backwardForwardButtons, 'likec4-navigation-webview')}
        align="flex-start"
        gap={'xs'}>
        {showBurgerMenu && (
          <ActionIcon
            onClick={e => {
              e.stopPropagation()
              store.getState().onBurgerMenuClick?.()
            }}>
            <IconMenu2 />
          </ActionIcon>
        )}
        <AnimatePresence>
          {hasStepBack && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0.05,
                transform: 'translateX(-10px)',
              }}
              key={'back'}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().goBack()
                }}>
                <IconChevronLeft />
              </ActionIcon>
            </m.div>
          )}
          {hasStepForward && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(10px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0,
                transform: 'translateX(10px)',
              }}
              key={'forward'}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().goForward()
                }}>
                <IconChevronRight />
              </ActionIcon>
            </m.div>
          )}
        </AnimatePresence>
      </Group>
    </LayoutGroup>
  )
}

const LayoutDriftNotification = (props: PopoverProps) => (
  <HoverCard
    position="right-start"
    openDelay={200}
    closeDelay={100}
    {...props}>
    <HoverCardTarget>
      <ActionIcon c="orange">
        <Overlay color={mantine.colors.orange.lightHover} backgroundOpacity={1} />
        <IconAlertTriangle />
      </ActionIcon>
    </HoverCardTarget>
    <HoverCardDropdown p={'0'}>
      <Notification
        color="orange"
        withBorder={false}
        withCloseButton={false}
        title="Manual layout issues">
        <Text mt={2} size="sm" lh="xs">
          View contains new elements or their sizes have changed,<br />
          last manual layout can not be applied.
        </Text>
        <Text mt={'xs'} size="sm" lh="xs">
          Update view predicates or remove <Code>@likec4-generated</Code>
        </Text>
      </Notification>
    </HoverCardDropdown>
  </HoverCard>
)

export const TopLeftPanel = () => {
  const store = useDiagramStoreApi()
  const {
    enableSearch,
    showNavigationButtons,
    showFitDiagram,
    showLayoutDriftWarning,
    showChangeAutoLayout,
    showGoToSource,
    viewportChanged,
    showManualLayoutTools,
  } = useDiagramState(s => {
    const isNotWalkthrough = isNullish(s.activeWalkthrough)
    const isNotFocused = isNullish(s.focusedNodeId)
    const isNotActive = isNotWalkthrough && isNotFocused
    return ({
      enableSearch: s.enableSearch,
      showNavigationButtons: !!s.onBurgerMenuClick || (s.showNavigationButtons && !!s.onNavigateTo),
      showFitDiagram: s.controls && s.fitViewEnabled && s.zoomable && isNotWalkthrough,
      showLayoutDriftWarning: s.controls && !s.readonly && s.view.hasLayoutDrift === true && isNotActive,
      showChangeAutoLayout: s.controls && s.isEditable() && isNotActive,
      showGoToSource: s.controls && !!s.onOpenSource && isNotWalkthrough,
      viewportChanged: s.viewportChanged,
      showManualLayoutTools: s.controls && s.readonly !== true && s.experimentalEdgeEditing === true,
    })
  })
  const portalProps = useMantinePortalProps()

  return (
    <TooltipGroup openDelay={600} closeDelay={150}>
      <Stack
        className={clsx(
          'react-flow__panel',
          css.panel,
          'likec4-top-left-panel',
        )}
        align="flex-start"
        onClick={e => e.stopPropagation()}
        gap={'xs'}>
        {showNavigationButtons && <BackwardForwardButtons />}
        <ActionIconGroup className={css.actionIconGroup} orientation="vertical">
          {enableSearch && (
            <Tooltip label="Search (Ctrl+F or ⌘+F)">
              <ActionIcon
                onClick={() => openSpotlight()}
              >
                <IconSearch />
              </ActionIcon>
            </Tooltip>
          )}
          {showGoToSource && (
            <Tooltip label="Open source" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().onOpenSourceView()
                }}>
                <IconFileSymlink stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          {showChangeAutoLayout && <ChangeAutoLayoutButton {...portalProps} />}
          {showLayoutDriftWarning && <LayoutDriftNotification {...portalProps} />}
          {showFitDiagram && (
            <Tooltip label={viewportChanged ? 'Center camera' : 'Camera is centered'} {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().fitDiagram()
                }}>
                <IconFocusCentered />
              </ActionIcon>
            </Tooltip>
          )}
        </ActionIconGroup>
      </Stack>
    </TooltipGroup>
  )
}
TopLeftPanel.displayName = 'TopLeftPanel'
