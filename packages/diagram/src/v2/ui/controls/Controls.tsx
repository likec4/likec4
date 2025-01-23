import { ActionIconGroup, Stack } from '@mantine/core'
import { openSpotlight } from '@mantine/spotlight'
import { IconFileSymlink, IconFocusCentered, IconSearch } from '@tabler/icons-react'
import { clsx } from 'clsx'
import { memo } from 'react'
import { useDiagramEventHandlers, useEnabledFeatures } from '../../../context'
import { stopPropagation } from '../../../xyflow/utils'
import { useDiagram, useDiagramContext } from '../../hooks'
import { ActionIcon, Tooltip } from './_shared'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { LayoutDriftNotification } from './LayoutDriftNotification'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'
import { NavigationButtons } from './NavigationButtons'
import * as css from './styles.css'

export const Controls = memo(() => {
  const { viewId, hasLayoutDrift, viewportChanged } = useDiagramContext(c => ({
    viewId: c.view.id,
    hasLayoutDrift: c.view.hasLayoutDrift ?? false,
    viewportChanged: c.viewportChangedManually,
  }))
  const diagram = useDiagram()
  const {
    onOpenSource,
  } = useDiagramEventHandlers()
  const {
    enableControls,
    enableSearch,
    enableNavigationButtons,
    enableReadOnly,
    enableEdgeEditing,
    enableVscode,
  } = useEnabledFeatures()
  const notReadOnly = !enableReadOnly
  return (
    <>
      <Stack
        className={clsx(
          'react-flow__panel',
          css.panel,
          'likec4-top-left-panel',
        )}
        align="flex-start"
        onClick={stopPropagation}
        gap={'xs'}>
        {enableNavigationButtons && <NavigationButtons />}
        <ActionIconGroup className={css.actionIconGroup} orientation="vertical">
          {enableControls && enableSearch && (
            <Tooltip label="Search (Ctrl+F or ⌘+F)">
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  openSpotlight()
                }}>
                <IconSearch />
              </ActionIcon>
            </Tooltip>
          )}
          {enableVscode && (
            <Tooltip label="Open source">
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  onOpenSource?.({ view: viewId })
                }}>
                <IconFileSymlink stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          {enableControls && hasLayoutDrift && <LayoutDriftNotification />}
          {enableControls && notReadOnly && (
            <>
              <ChangeAutoLayoutButton />
              <ManualLayoutToolsButton />
            </>
          )}
          {enableControls && (
            <Tooltip label={viewportChanged ? 'Center camera' : 'Camera is centered'}>
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
    </>
  )
})
