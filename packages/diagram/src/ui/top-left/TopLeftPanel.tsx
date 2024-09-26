import {
  ActionIconGroup,
  Code,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Overlay,
  type PopoverProps,
  Stack,
  Text,
  TooltipGroup,
  type TooltipProps
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconFileSymlink,
  IconFocusCentered,
  IconMenu2,
  IconRouteOff
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
  hasStepBack: s.navigationHistoryIndex > 0,
  hasStepForward: s.navigationHistoryIndex < s.navigationHistory.length - 1
})

const BackwardForwardButtons = () => {
  const store = useDiagramStoreApi()
  const {
    showBurgerMenu,
    hasStepBack,
    hasStepForward
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
                transform: 'translateX(-10px)'
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
                transform: 'translateX(10px)'
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

const ResetControlPointsButton = (props: Omit<TooltipProps, 'label' | 'children'>) => {
  const store = useDiagramStoreApi()

  return (
    <Tooltip label="Reset all control points" {...props}>
      <ActionIcon
        onClick={e => {
          e.stopPropagation()
          store.getState().resetEdgeControlPoints()
        }}>
        <IconRouteOff />
      </ActionIcon>
    </Tooltip>
  )
}

export const TopLeftPanel = () => {
  const store = useDiagramStoreApi()
  const {
    showNavigationButtons,
    showFitDiagram,
    showLayoutDriftWarning,
    showChangeAutoLayout,
    showGoToSource,
    viewportChanged,
    showResetControlPoints
  } = useDiagramState(s => {
    const isNotWalkthrough = isNullish(s.activeWalkthrough)
    const isNotFocused = isNullish(s.focusedNodeId)
    const isNotActive = isNotWalkthrough && isNotFocused
    return ({
      showNavigationButtons: !!s.onBurgerMenuClick || s.showNavigationButtons && !!s.onNavigateTo,
      showFitDiagram: s.fitViewEnabled && s.zoomable && isNotWalkthrough,
      showLayoutDriftWarning: !s.readonly && s.view.hasLayoutDrift === true && isNotActive,
      showChangeAutoLayout: s.isEditable() && isNotActive,
      showGoToSource: !!s.onOpenSourceView && isNotWalkthrough,
      viewportChanged: s.viewportChanged,
      showResetControlPoints: s.readonly !== true && s.experimentalEdgeEditing === true
    })
  })
  const portalProps = useMantinePortalProps()

  return (
    <TooltipGroup openDelay={500} closeDelay={150}>
      <Stack
        className={clsx(
          'react-flow__panel',
          css.panel,
          'likec4-top-left-panel'
        )}
        align="flex-start"
        onClick={e => e.stopPropagation()}
        gap={'xs'}>
        {showNavigationButtons && <BackwardForwardButtons />}
        <ActionIconGroup className={css.actionIconGroup} orientation="vertical">
          {showGoToSource && (
            <Tooltip label="Open source" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().onOpenSourceView?.()
                }}>
                <IconFileSymlink stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          {showChangeAutoLayout && <ChangeAutoLayoutButton {...portalProps} />}
          {showLayoutDriftWarning && <LayoutDriftNotification {...portalProps} />}
          {showResetControlPoints && <ResetControlPointsButton {...portalProps} />}
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
