import {
  Code,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  type PopoverProps,
  Stack,
  Text
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconClearAll,
  IconFileSymlink,
  IconFocusCentered,
  IconMenu2,
  IconRouteOff
} from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
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
    <Group
      className={'likec4-navigation-panel'}
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
  )
}

const LayoutDriftNotification = (props: PopoverProps) => (
  <HoverCard
    position="right-start"
    openDelay={200}
    closeDelay={100}
    {...props}>
    <HoverCardTarget>
      <ActionIcon
        className="action-icon"
        variant="light"
        color="orange">
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

const ResetControlPointsButton = () => {
  const store = useDiagramStoreApi()

  return (
    <AnimatePresence>
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
            store.getState().resetEdgeControlPoints()
          }}>
          <IconRouteOff />
        </ActionIcon>
      </m.div>
    </AnimatePresence>
  )
}

export const TopLeftPanel = () => {
  const store = useDiagramStoreApi()
  const {
    showNavigationButtons,
    showFitDiagram,
    showLayoutDriftWarning,
    showChangeAutoLayout,
    showGoToSource
  } = useDiagramState(s => {
    const isNotActive = s.activeWalkthrough === null && s.focusedNodeId === null
    return ({
      showNavigationButtons: !!s.onBurgerMenuClick || s.showNavigationButtons && !!s.onNavigateTo,
      showFitDiagram: s.fitViewEnabled && s.zoomable && s.viewportChanged,
      showLayoutDriftWarning: s.readonly !== true && s.view.hasLayoutDrift === true && isNotActive,
      showChangeAutoLayout: s.readonly !== true && !!s.onChange && isNotActive,
      showGoToSource: !!s.onOpenSourceView
    })
  })
  const portalProps = useMantinePortalProps()

  return (
    <Stack
      className={clsx(
        'react-flow__panel',
        css.panel,
        'likec4-top-left-panel'
      )}
      onClick={e => e.stopPropagation()}
      gap={'xs'}>
      {showNavigationButtons && <BackwardForwardButtons />}
      {showGoToSource && (
        <Tooltip label="Go to source" {...portalProps}>
          <ActionIcon
            className="action-icon"
            onClick={e => {
              e.stopPropagation()
              store.getState().onOpenSourceView?.()
            }}>
            <IconFileSymlink stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      )}
      {showChangeAutoLayout && <ChangeAutoLayoutButton {...portalProps} />}
      <AnimatePresence>
        {showLayoutDriftWarning && (
          <m.div
            initial={{ opacity: 0.05, transform: 'translateX(-40%)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0,
              transform: 'translateX(-40%)'
            }}
            key={'layout'}>
            <LayoutDriftNotification {...portalProps} />
          </m.div>
        )}
        <ResetControlPointsButton />
        {showFitDiagram && (
          <m.div
            initial={{ opacity: 0.05, transform: 'translateX(-20%)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0,
              transform: 'translateX(-30%)'
            }}
            key={'fit-view'}>
            <Tooltip label="Center camera" {...portalProps}>
              <ActionIcon
                className="action-icon"
                onClick={e => {
                  e.stopPropagation()
                  store.getState().fitDiagram()
                }}>
                <IconFocusCentered />
              </ActionIcon>
            </Tooltip>
          </m.div>
        )}
      </AnimatePresence>
    </Stack>
  )
}
TopLeftPanel.displayName = 'TopLeftPanel'
