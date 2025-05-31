import { cx } from '@likec4/styles/css'
import { ActionIconGroup, Badge, Box, Group, Loader, Stack } from '@mantine/core'
import { IconFileSymlink, IconFocusCentered, IconMenu2 } from '@tabler/icons-react'
import { LayoutGroup, m } from 'motion/react'
import { memo } from 'react'
import { SearchControl } from '../../../components/SearchControl'
import { useDiagramEventHandlers, useEnabledFeatures } from '../../../context'
import { type ControlsCustomLayout, useControlsCustomLayout } from '../../../context/ControlsCustomLayout'
import { useMantinePortalProps } from '../../../hooks'
import { useDiagram, useDiagramContext, useDiagramSyncLayoutState } from '../../../hooks/useDiagram'
import { stopPropagation } from '../../../utils'
import { ActionIcon, Tooltip } from './_shared'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { LayoutDriftNotification } from './LayoutDriftNotification'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'
import { NavigationButtons } from './NavigationButtons'
import * as css from './styles.css'
import { ToggleReadonly } from './ToggleReadonly'

const ControlsDefaultLayout: ControlsCustomLayout = ({
  burgerMenu,
  navigationButtons,
  search,
  actionsGroup,
}) => (
  <Group
    component={m.div}
    // @ts-expect-error group component not fully polymorphic
    initial={{
      opacity: 0.05,
      translateX: -30,
      translateY: -16,
    }}
    animate={{
      opacity: 1,
      translateX: 0,
      translateY: 0,
    }}
    exit={{
      opacity: 0.05,
      translateX: -30,
      translateY: -10,
    }}
    align="flex-start"
    className={cx(
      'react-flow__panel',
      css.panel,
      'likec4-top-left-panel',
    )}
    gap="xs"
    onClick={stopPropagation}
  >
    <Stack align="flex-start" gap="xs">
      <LayoutGroup>
        <Group
          className={cx(css.navigationButtons, 'likec4-navigation-webview')}
          gap={'xs'}>
          {burgerMenu}
          {navigationButtons}
        </Group>
      </LayoutGroup>
      {actionsGroup}
    </Stack>
    <Box>
      {search}
    </Box>
  </Group>
)

export const Controls = memo(() => {
  const { viewId, hasLayoutDrift, viewportChanged, isNotActiveWalkthrough } = useDiagramContext(c => ({
    viewId: c.view.id,
    hasLayoutDrift: c.view.hasLayoutDrift ?? false,
    viewportChanged: c.viewportChangedManually,
    isNotActiveWalkthrough: c.activeWalkthrough === null,
  }))
  const diagram = useDiagram()
  const {
    onOpenSource,
    onBurgerMenuClick,
  } = useDiagramEventHandlers()
  const {
    enableControls,
    enableSearch,
    enableNavigationButtons,
    enableReadOnly,
    enableVscode,
  } = useEnabledFeatures()
  const notReadOnly = !enableReadOnly
  const portalProps = useMantinePortalProps()
  const ControlsLayout = useControlsCustomLayout() ?? ControlsDefaultLayout
  return (
    <>
      {isNotActiveWalkthrough && (
        <ControlsLayout
          burgerMenu={onBurgerMenuClick && (
            <ActionIcon
              onClick={e => {
                e.stopPropagation()
                onBurgerMenuClick()
              }}>
              <IconMenu2 />
            </ActionIcon>
          )}
          navigationButtons={enableNavigationButtons && <NavigationButtons />}
          search={enableSearch && (
            <SearchControl
              onClick={e => {
                e.stopPropagation()
                diagram.openSearch()
              }}
            />
          )}
          syncInProgressBadge={<SyncLayoutBadge />}
          actionsGroup={
            <ActionIconGroup className={css.actionIconGroup} orientation="vertical">
              {enableVscode && (
                <Tooltip label="Open source" {...portalProps}>
                  <ActionIcon
                    onClick={e => {
                      e.stopPropagation()
                      onOpenSource?.({ view: viewId })
                    }}>
                    <IconFileSymlink stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
              {enableControls && <ToggleReadonly />}
              {enableControls && hasLayoutDrift && <LayoutDriftNotification {...portalProps} />}
              {enableControls && notReadOnly && (
                <>
                  <ChangeAutoLayoutButton {...portalProps} />
                  <ManualLayoutToolsButton {...portalProps} />
                </>
              )}
              {enableControls && (
                <Tooltip label={viewportChanged ? 'Center camera' : 'Camera is centered'} {...portalProps}>
                  <ActionIcon
                    onClick={e => {
                      e.stopPropagation()
                      diagram.fitDiagram()
                    }}>
                    <IconFocusCentered />
                  </ActionIcon>
                </Tooltip>
              )}
            </ActionIconGroup>
          }
        />
      )}
    </>
  )
})

const SyncLayoutBadge = () => {
  const isPending = useDiagramSyncLayoutState(s => s.hasTag('pending'))
  if (!isPending) return null
  return (
    <Badge color="pink" radius={'xs'} size="xs" variant="light" leftSection={<Loader color={'orange'} size={8} />}>
      Pending...
    </Badge>
  )
}
