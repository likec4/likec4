import { ActionIconGroup, Badge, Group, Loader, Stack } from '@mantine/core'
import { IconFileSymlink, IconFocusCentered, IconMenu2 } from '@tabler/icons-react'
import { clsx } from 'clsx'
import { LayoutGroup } from 'framer-motion'
import { memo } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures } from '../../../context'
import { useMantinePortalProps } from '../../../hooks'
import { useDiagram, useDiagramContext, useDiagramSyncLayoutState } from '../../../hooks/useDiagram'
import { stopPropagation } from '../../../utils'
import { LikeC4Search } from '../search/LikeC4Search'
import { ActionIcon, Tooltip } from './_shared'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { LayoutDriftNotification } from './LayoutDriftNotification'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'
import { NavigationButtons } from './NavigationButtons'
import * as css from './styles.css'
import { ToggleReadonly } from './ToggleReadonly'

export const Controls = memo(() => {
  const { viewId, hasLayoutDrift, viewportChanged } = useDiagramContext(c => ({
    viewId: c.view.id,
    hasLayoutDrift: c.view.hasLayoutDrift ?? false,
    viewportChanged: c.viewportChangedManually,
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

  return (
    <Group
      align="flex-start"
      className={clsx(
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
            className={clsx(css.navigationButtons, 'likec4-navigation-webview')}
            gap={'xs'}>
            {onBurgerMenuClick && (
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  onBurgerMenuClick()
                }}>
                <IconMenu2 />
              </ActionIcon>
            )}
            {enableNavigationButtons && <NavigationButtons />}
          </Group>
        </LayoutGroup>
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
      </Stack>
      <Group>
        {enableSearch && <LikeC4Search />}
        {/* {notReadOnly && <SyncLayoutBadge />} */}
      </Group>
    </Group>
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
